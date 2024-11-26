import { supabase } from "../lib/supabase";
import { uploadFile } from "./imageService";

export const createOrUpdatePost = async (post) => {
  try {
    // Upload image if `post.file` is an object
    if (post.file && typeof post.file == "object") {
      let isImage = post.file.type == "image";
      let folderName = isImage ? "postImages" : "postVideos";
      let fileResult = await uploadFile(folderName, post?.file?.uri, isImage);

      if (fileResult.success) {
        post.file = fileResult.data; // Assign the public URL
      } else {
        return fileResult; // Return early if file upload failed
      }
    }

    // Check if post has an id for updating
    if (post.id) {
      // Update post data in Supabase
      const { data, error } = await supabase
        .from("posts")
        .update(post) // Use update instead of insert
        .eq("id", post.id) // Specify which post to update
        .select()
        .single();

      if (error) {
        console.log("updatePost error: ", error);
        return { success: false, msg: "Could not update your post" };
      }

      // Return success response
      return { success: true, msg: "Post updated successfully", data };
    } else {
      // Insert post data into Supabase
      const { data, error } = await supabase
        .from("posts")
        .insert(post)
        .select()
        .single();

      if (error) {
        console.log("createPost error: ", error);
        return { success: false, msg: "Could not create your post" };
      }

      // Return success response
      return { success: true, msg: "Post created successfully", data };
    }
  } catch (error) {
    console.log("createOrUpdatePost error: ", error);
    return { success: false, msg: "Could not create or update your post" };
  }
};

export const fetchPosts = async (limit = 10, userId) => {
  try {
    if (userId) {
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          user: profiles (id, name, image),
          postLikes (*),
          comments (count)
        `
        )
        .order("created_at", { ascending: false }) // Corrected here
        .eq("userId", userId)
        .limit(limit);

      if (error) {
        console.log("fetch error: ", error);
        return { success: false, msg: "Could not fetch the posts" };
      }

      return { success: true, data: data };
    } else {
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          user: profiles (id, name, image),
          postLikes (*),
          comments (count)
        `
        )
        .order("created_at", { ascending: false }) // Corrected here
        .limit(limit);

      if (error) {
        console.log("fetch error: ", error);
        return { success: false, msg: "Could not fetch the posts" };
      }

      return { success: true, data: data };
    }
  } catch (error) {
    console.log("fetchPost error: ", error);
    return { success: false, msg: "Could not fetch the posts" };
  }
};

export const createPostLike = async (data) => {
  try {
    const { error } = await supabase.from("postLikes").insert([data]);
    if (error) {
      console.error("Error creating post like:", error);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: err };
  }
};

// Function to remove a post like
export const removePostLike = async (postId, userId) => {
  try {
    const { error } = await supabase
      .from("postLikes")
      .delete()
      .match({ postId, userId });
    if (error) {
      console.error("Error removing post like:", error);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: err };
  }
};

export const fetchPostDetails = async (postId) => {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
          *,
          user: profiles (id, name, image),
          postLikes (*),
          comments (*, user: profiles(id, name, image))
        `
      )
      .eq("id", postId)
      .order("created_at", { ascending: false, foreignTable: "comments" })
      .single();

    if (error) {
      console.log("fetchPostDetails error: ", error);
      return { success: false, msg: "Could not fetch the post" };
    }

    return { success: true, data: data };
  } catch (error) {
    console.log("fetchPostDetails error: ", error);
    return { success: false, msg: "Could not fetch the post" };
  }
};

export const createComment = async (comment) => {
  try {
    const { data, error } = await supabase
      .from("comments")
      .insert(comment)
      .select()
      .single();

    if (error) {
      console.error("comment error :", error);
      return { success: false, msg: "Could not create your comment" };
    }
    return { success: true, data: data };
  } catch (err) {
    console.error("comment error:", err);
    return { success: false, msg: "Could mot create your comment" };
  }
};

export const removeComment = async (commentId) => {
  try {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);
    if (error) {
      console.error("removeComment error:", error);
      return { success: false, msg: "Could not remove the comment" };
    }
    return { success: true, data: { commentId } };
  } catch (err) {
    console.error("removeComment error:", err);
    return { success: false, msg: "Could not remove the comment" };
  }
};

export const removePost = async (postId) => {
  try {
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      console.error("removePost error:", error);
      return { success: false, msg: "Could not remove the post" };
    }
    return { success: true, data: { postId } };
  } catch (err) {
    console.error("removePost error:", err);
    return { success: false, msg: "Could not remove the post" };
  }
};
