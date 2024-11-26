import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";
import { supabase } from "../lib/supabase";
import { supabaseUrl } from "../constants";

// Function to get the user image source
export const getUserImageSrc = (imagePath) => {
  if (imagePath) {
    return { uri: imagePath };
  } else {
    return require("../assets/images/userimg.png");
  }
};

// Modified function to get the correct Supabase file URL
export const getSuperbaseFileUrl = (filePath) => {
  if (filePath && !filePath.startsWith("http")) {
    // Only append supabaseUrl if filePath is a relative path
    return {
      uri: `${supabaseUrl}/storage/v1/object/public/uploads/${filePath}`,
    };
  }
  // Return the filePath as it is if it's already a full URL or invalid
  return filePath ? { uri: filePath } : null;
};

export const downloadFile = async (url) => {
  try {
    const { uri } = await FileSystem.downloadAsync(url, getLocalFilePath(url));
    return uri;
  } catch (error) {
    console.error("Download error:", error);
    return null;
  }
};

export const getLocalFilePath = (filePath) => {
  let fileName = filePath.split("/").pop();
  return `${FileSystem.documentDirectory}${fileName}`;
};

// Function to upload file to Supabase storage
export const uploadFile = async (folderName, fileUri, isImage = true) => {
  try {
    let fileName = getFilePath(folderName, isImage);
    const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    let imageData = decode(fileBase64); // array buffer

    // Upload file to Supabase storage
    let { data, error } = await supabase.storage
      .from("uploads")
      .upload(fileName, imageData, {
        cacheControl: "3600",
        upsert: false,
        contentType: isImage ? "image/*" : "video/*",
      });

    if (error || !data) {
      console.log("file upload error: ", error);
      return { success: false, msg: "Could not upload media", data: null };
    }

    // Generate the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from("uploads")
      .getPublicUrl(data.path);

    if (publicUrlData) {
      return { success: true, data: publicUrlData.publicUrl };
    } else {
      return { success: false, msg: "Could not retrieve public URL" };
    }
  } catch (error) {
    console.log("file upload error: ", error);
    return { success: false, msg: "Could not upload media" };
  }
};

// Helper function to generate a file path
export const getFilePath = (folderName, isImage) => {
  return `${folderName}/${new Date().getTime()}${isImage ? ".png" : ".mp4"}`;
};
