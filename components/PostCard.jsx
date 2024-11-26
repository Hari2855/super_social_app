import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  // Share,
} from "react-native";
import React, { useEffect, useState, useMemo } from "react";
import { theme } from "../constants/theme";
import Avatar from "./Avatar";
import { hp, stripHtmlTags, wp } from "../helpers/common";
import moment from "moment";
import Icon from "../assets/icons";
import RenderHtml from "react-native-render-html";
import { Image } from "expo-image";
import { downloadFile, getSuperbaseFileUrl } from "../services/imageService";
import { Video } from "expo-av";
import { createPostLike, removePostLike } from "../services/postService";
import * as Sharing from "expo-sharing";
import Loading from "./Loading";

const textStyle = {
  color: theme.colors.dark,
  fontSize: hp(1.75),
};

const tagsStyles = {
  div: textStyle,
  p: textStyle,
  ol: textStyle,
  h1: {
    color: theme.colors.dark,
  },
  h4: {
    color: theme.colors.dark,
  },
};

const PostCard = ({
  item,
  currentUser,
  router,
  hasShadow = true,
  showMoreIcon = true,
  showDelete = false,
  onDelete = () => {},
  onEdit = () => {},
}) => {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize likes state with post likes from the item
  useEffect(() => {
    setLikes(item?.postLikes || []);
  }, [item]);

  // Determine if the current user has liked the post
  const Liked = useMemo(
    () => likes.some((like) => like.userId === currentUser?.id),
    [likes, currentUser]
  );

  const shadowStyles = {
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  };

  const openPostDetails = () => {
    if (!showMoreIcon) return null;
    router.push({ pathname: "postDetails", params: { postId: item?.id } });
  };

  // Handle like/unlike actions
  const onLike = async () => {
    if (!currentUser?.id) {
      Alert.alert("Error", "User not logged in.");
      return;
    }

    if (Liked) {
      // Unlike post
      const updatedLikes = likes.filter(
        (like) => like.userId !== currentUser.id
      );
      setLikes(updatedLikes);

      const res = await removePostLike(item?.id, currentUser?.id);
      if (!res.success) {
        Alert.alert("Error", "Failed to unlike the post.");
        setLikes([...likes]); // Revert on failure
      }
    } else {
      // Like post
      const newLike = { userId: currentUser.id, postId: item.id };
      setLikes([...likes, newLike]);

      const res = await createPostLike(newLike);
      if (!res.success) {
        Alert.alert("Error", "Failed to like the post.");
        setLikes(likes); // Revert on failure
      }
    }
  };

  const onShare = async () => {
    try {
      let content = { message: stripHtmlTags(item?.body) };

      if (item?.file) {
        // Download the file and get the local URI
        setLoading(true);
        const fileUrl = getSuperbaseFileUrl(item?.file).uri; // Ensure you get the correct URI
        const downloadedUri = await downloadFile(fileUrl);
        setLoading(false);

        if (downloadedUri) {
          // Use the downloaded URI for sharing
          const shareOptions = {
            url: downloadedUri,
            message: content.message,
          };

          await Sharing.shareAsync(shareOptions.url, {
            dialogTitle: "Share this media",
            UTI: "public.movie",
          });
        } else {
          Alert.alert("Error", "Failed to download the media file.");
          return;
        }
      } else {
        await Share.share({ message: content.message });
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while sharing the content.");
      console.error("Share error: ", error);
    }
  };

  // console.log("post item:", item);
  // console.log("post item comments: ", item?.comments);

  const createdAt = moment(item?.created_at).format("MMM D, h:mm a");

  const handlePostDelete = async () => {
    Alert.alert("Confirm", "Are you soure you want to do this?", [
      {
        text: "Cancel",
        onPress: () => console.log("modal cancelled"),
        style: "cancel",
      },
      {
        text: "Delete",
        onPress: () => onDelete(item),
        style: "destructive",
      },
    ]);
  };

  return (
    <View style={[styles.container, hasShadow && shadowStyles]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userinfo}>
          <Avatar
            size={hp(4.5)}
            uri={item?.user?.image}
            rounded={theme.radius.md}
          />
          <View style={{ gap: 2 }}>
            <Text style={styles.username}>{item?.user?.name}</Text>
            <Text style={styles.postTime}>{createdAt}</Text>
          </View>
        </View>

        {showMoreIcon && (
          <TouchableOpacity onPress={openPostDetails}>
            <Icon
              name="threeDotsHorizontal"
              size={hp(3.4)}
              strikeWidth={3}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        )}

        {showDelete && currentUser.id == item?.userId && (
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => onEdit(item)}>
              <Icon name="edit" size={hp(2.5)} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePostDelete}>
              <Icon name="delete" size={hp(2.5)} color={theme.colors.rose} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Post Body and Media */}
      <View style={styles.content}>
        <View style={styles.postBody}>
          {item?.body && (
            <RenderHtml
              contentWidth={wp(100)}
              source={{ html: item?.body }}
              tagsStyles={tagsStyles}
            />
          )}
        </View>

        {/* Post Image */}
        {item?.file && item?.file?.includes("postImages") && (
          <Image
            source={getSuperbaseFileUrl(item?.file)}
            transition={100}
            style={styles.postMedia}
            contentFit="cover"
          />
        )}

        {/* Post Video */}
        {item?.file && item?.file?.includes("postVideos") && (
          <Video
            style={[styles.postMedia, { height: hp(30) }]}
            source={getSuperbaseFileUrl(item?.file)}
            useNativeControls
            resizeMode="cover"
            isLooping
          />
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Like Button */}
        <View style={styles.footerButton}>
          <TouchableOpacity onPress={onLike}>
            <Icon
              name="heart"
              size={24}
              fill={Liked ? theme.colors.rose : "transparent"}
              color={Liked ? theme.colors.rose : theme.colors.textLight}
            />
          </TouchableOpacity>
          <Text style={styles.count}>{likes.length}</Text>
        </View>

        {/* Comment Button */}
        <View style={styles.footerButton}>
          <TouchableOpacity onPress={openPostDetails}>
            <Icon name="comment" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
          <Text style={styles.count}>{item?.comments[0]?.count}</Text>
        </View>

        {/* Share Button */}
        <View style={styles.footerButton}>
          {loading ? (
            <Loading size="small" />
          ) : (
            <TouchableOpacity onPress={onShare}>
              <Icon name="share" size={24} color={theme.colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default PostCard;

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginBottom: 15,
    borderRadius: theme.radius.xl * 1.1,
    borderCurve: "continuous",
    padding: 10,
    backgroundColor: "white",
    borderWidth: 0.5,
    borderColor: theme.colors.gray,
    shadowColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  userinfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  username: {
    fontSize: hp(1.7),
    color: theme.colors.textDark,
    fontWeight: theme.fonts.medium,
  },
  postTime: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    fontWeight: theme.fonts.medium,
  },
  content: {
    gap: 10,
  },
  postMedia: {
    height: hp(40),
    width: "100%",
    borderRadius: theme.radius.xl,
    borderCurve: "continuous",
  },
  postBody: {
    marginLeft: 5,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  footerButton: {
    marginLeft: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  count: {
    color: theme.colors.text,
    fontSize: hp(1.8),
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
});
