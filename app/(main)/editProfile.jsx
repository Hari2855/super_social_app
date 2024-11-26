import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import ScreenWrapper from "../../components/ScreenWrapper";
import { hp, wp } from "../../helpers/common";
import Header from "../../components/Header";
import { useAuth } from "../../context/AuthContext";
import { getUserImageSrc, uploadFile } from "../../services/imageService";
import Icon from "../../assets/icons";
import { theme } from "../../constants/theme";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { updateUser } from "../../services/userService";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

const EditProfile = () => {
  const { user: currentUser, setUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [user, setUser] = useState({
    name: "",
    phoneNumber: "",
    image: null,
    bio: "",
    address: "",
  });

  useEffect(() => {
    if (currentUser) {
      setUser({
        name: currentUser.name || "",
        phoneNumber: currentUser.phoneNumber || "",
        image: currentUser.image || null,
        bio: currentUser.bio || "",
        address: currentUser.address || "",
      });
    }
  }, [currentUser]);

  const validateInput = () => {
    const { name, phoneNumber, address, bio, image } = user;

    if (!name.trim()) {
      Alert.alert("Validation Error", "Name is required!");
      return false;
    }

    if (!phoneNumber.trim() || !/^\+\d{1,4}\d{6,14}$/.test(phoneNumber)) {
      Alert.alert(
        "Validation Error",
        "Enter a valid phone number with country code!"
      );
      return false;
    }

    if (!address.trim()) {
      Alert.alert("Validation Error", "Address is required!");
      return false;
    }

    if (!bio.trim()) {
      Alert.alert("Validation Error", "Bio is required!");
      return false;
    }

    if (!image) {
      Alert.alert("Validation Error", "Profile image is required!");
      return false;
    }

    return true;
  };

  const onPickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 1, // Request highest quality
    });

    if (!result.canceled && result.assets.length > 0) {
      setUser({ ...user, image: result.assets[0].uri });
    }
  };

  const onSubmit = async () => {
    if (!validateInput()) return;

    let userData = { ...user };
    setLoading(true);

    if (user.image.startsWith("file://")) {
      let imageRes = await uploadFile("profile", user.image, true);
      if (imageRes.success) {
        userData.image = imageRes.data; // Set public URL
      } else {
        Alert.alert("Image Upload Error", imageRes.msg);
        userData.image = null;
      }
    }

    const res = await updateUser(currentUser?.id, userData);
    setLoading(false);

    if (res.success) {
      setUserData({ ...currentUser, ...userData });
      router.back();
    } else {
      Alert.alert("Profile Update Error", res.message);
    }
  };

  let imageSource = user.image
    ? { uri: user.image }
    : getUserImageSrc(user.image);

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <ScrollView style={{ flex: 1 }}>
          <Header title="Edit Profile" />

          <View style={styles.form}>
            <View style={styles.avatarContainer}>
              <Image source={imageSource} style={styles.avatar} />
              <Pressable style={styles.cameraIcon} onPress={onPickImage}>
                <Icon name="camera" size={20} strokeWidth={2.5} />
              </Pressable>
            </View>
            <Text
              style={{
                fontSize: hp(1.8),
                color: theme.colors.text,
                marginTop: hp(3),
              }}
            >
              Please fill your profile details
            </Text>
            <Input
              icon={<Icon name="user" />}
              placeholder="Enter your name"
              value={user.name}
              onChangeText={(value) => setUser({ ...user, name: value })}
            />
            <Input
              icon={<Icon name="call" />}
              placeholder="Enter your phone number (e.g., +91234567890)"
              value={user.phoneNumber}
              onChangeText={(value) =>
                setUser({ ...user, phoneNumber: value })
              }
            />
            <Input
              icon={<Icon name="location" />}
              placeholder="Enter your address"
              value={user.address}
              onChangeText={(value) => setUser({ ...user, address: value })}
            />
            <Input
              placeholder="Enter your bio"
              value={user.bio}
              multiline={true}
              containerStyle={styles.bio}
              onChangeText={(value) => setUser({ ...user, bio: value })}
            />

            <Button title="Update" loading={loading} onPress={onSubmit} />
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  avatarContainer: {
    height: hp(15),
    width: hp(15),
    alignSelf: "center",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: theme.radius.xxl * 1.8,
    borderWidth: 1,
    borderColor: theme.colors.darkLight,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: -10,
    padding: 8,
    borderRadius: 50,
    backgroundColor: "white",
    shadowColor: theme.colors.textLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 7,
  },
  form: {
    gap: 10,
    marginTop: 20,
  },
  bio: {
    flexDirection: "row",
    height: hp(15),
    alignItems: "flex-start",
    paddingVertical: 15,
  },
});
