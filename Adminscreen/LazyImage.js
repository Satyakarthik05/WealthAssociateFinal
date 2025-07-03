import React, { useState, useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ShimmerPlaceHolder from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";

// Directory to cache images
const IMAGE_CACHE_DIR = FileSystem.cacheDirectory + "image-cache/";

// Ensure cache directory exists
const ensureDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
  if (!dirInfo.exists || !dirInfo.isDirectory) {
    await FileSystem.makeDirectoryAsync(IMAGE_CACHE_DIR, {
      intermediates: true,
    });
  }
};

// Cache image locally
const cacheImage = async (uri, cacheKey) => {
  try {
    await ensureDirExists();
    const localUri = IMAGE_CACHE_DIR + cacheKey;
    const fileInfo = await FileSystem.getInfoAsync(localUri);

    if (!fileInfo.exists) {
      await FileSystem.downloadAsync(uri, localUri);
      await AsyncStorage.setItem(`imageCache_${cacheKey}`, localUri);
    }

    return localUri;
  } catch (error) {
    console.error("Error caching image:", error);
    return uri;
  }
};

// Check if cached image exists
const getCachedImage = async (uri, cacheKey) => {
  try {
    const localUri = await AsyncStorage.getItem(`imageCache_${cacheKey}`);
    if (localUri) {
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (fileInfo.exists) {
        return { uri: localUri, fromCache: true };
      }
    }
    return { uri, fromCache: false };
  } catch (error) {
    console.error("Error getting cached image:", error);
    return { uri, fromCache: false };
  }
};

// Main LazyImage component
const LazyImage = ({ source, style, resizeMode = "cover", cacheKey }) => {
  const [imageUri, setImageUri] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    let isMounted = true;
    let retryTimeout;

    const loadImage = async () => {
      try {
        if (typeof source === "number") {
          if (isMounted) {
            setImageUri(source);
            setIsLoaded(true);
          }
          return;
        }

        if (
          !source?.uri ||
          (!source.uri.startsWith("http") && !source.uri.startsWith("file"))
        ) {
          if (isMounted) setIsError(true);
          return;
        }

        if (cacheKey) {
          const cached = await getCachedImage(source.uri, cacheKey);
          if (cached.fromCache && isMounted) {
            setImageUri(cached.uri);
            setIsLoaded(true);
            return;
          }

          const localUri = await cacheImage(source.uri, cacheKey);
          if (isMounted) {
            setImageUri(localUri);
            setIsLoaded(true);
          }
        } else {
          if (isMounted) {
            setImageUri(source.uri);
            setIsLoaded(true);
          }
        }
      } catch (error) {
        console.error("Error loading image:", error);
        if (isMounted && retryCount < maxRetries) {
          retryTimeout = setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 1000 * (retryCount + 1));
        } else if (isMounted) {
          setIsError(true);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
      clearTimeout(retryTimeout);
    };
  }, [source, cacheKey, retryCount]);

  const handleError = () => {
    if (retryCount < maxRetries) {
      setRetryCount((prev) => prev + 1);
    } else {
      setIsError(true);
    }
  };

  if (isError) {
    return (
      <View style={[style, styles.imagePlaceholder]}>
        <Image
          source={require("../assets/logo.png")}
          style={[style, { resizeMode: "contain" }]}
        />
      </View>
    );
  }

  return (
    <ShimmerPlaceHolder
      LinearGradient={LinearGradient}
      visible={isLoaded}
      style={[styles.defaultSize, style, styles.shimmer]}
      shimmerStyle={{ borderRadius: 8, backgroundColor: "#e0e0e0" }}
    >
      {imageUri && (
        <Image
          source={typeof imageUri === "number" ? imageUri : { uri: imageUri }}
          style={[styles.defaultSize, style]}
          resizeMode={resizeMode}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
        />
      )}
    </ShimmerPlaceHolder>
  );
};

// Attach preload method AFTER LazyImage is defined
LazyImage.preload = async (uri, cacheKey = null) => {
  try {
    if (!uri || typeof uri !== "string") return;
    if (!cacheKey) {
      cacheKey = encodeURIComponent(uri);
    }
    await cacheImage(uri, cacheKey);
  } catch (error) {
    console.error("Error preloading image:", error);
  }
};

const styles = StyleSheet.create({
  shimmer: {
    borderRadius: 8,
    overflow: "hidden",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  defaultSize: {
    width: 200,
    height: 150,
  },
});

export default LazyImage;
