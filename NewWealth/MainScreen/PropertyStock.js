import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../data/ApiUrl";
import LazyImage, { preload } from "../components/home/LazyImage";

// Cache expiration time (1 day in milliseconds)
const CACHE_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

// data.forEach((property) => {
//   const images = normalizeImageSources(property);
//   images.forEach((uri) => {
//     const key = encodeURIComponent(uri);
//     preload(uri, key); // Now this works
//   });
// });

// Helper function to get property tag
const getPropertyTag = (createdAt) => {
  const currentDate = new Date();
  const propertyDate = new Date(createdAt);
  const timeDifference = currentDate - propertyDate;
  const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

  if (daysDifference <= 3) return "Regular Property";
  if (daysDifference >= 4 && daysDifference <= 17) return "Approved Property";
  if (daysDifference >= 18 && daysDifference <= 25) return "Wealth Property";
  return "Listed Property";
};

// 🔹 Fetch from API, cache it, and preload images
const fetchPropertiesFromAPI = async () => {
  try {
    const response = await fetch(`${API_URL}/properties/getApproveProperty`);
    const data = await response.json();

    if (data && Array.isArray(data) && data.length > 0) {
      // Cache data with timestamp
      const cacheData = {
        data: data,
        timestamp: new Date().getTime(),
      };
      await AsyncStorage.setItem("propertyCache", JSON.stringify(cacheData));

      // Preload images safely
      data.forEach((property) => {
        const images = normalizeImageSources(property);
        images.forEach((uri) => {
          try {
            LazyImage.preload(uri);
          } catch (error) {
            console.error(`Error preloading image ${uri}:`, error);
          }
        });
      });

      return data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching properties:", error);
    return [];
  }
};

// 🔹 Try loading from AsyncStorage cache
const getCachedProperties = async () => {
  try {
    const cachedData = await AsyncStorage.getItem("propertyCache");
    if (!cachedData) return null;

    const parsedData = JSON.parse(cachedData);
    const currentTime = new Date().getTime();

    if (currentTime - parsedData.timestamp < CACHE_EXPIRATION_TIME) {
      return parsedData.data;
    }
    return null;
  } catch (error) {
    console.error("Error reading cache:", error);
    return null;
  }
};

// 🔹 Normalize and fix image URLs (handles all common corruption cases)
const normalizeImageSources = (property) => {
  if (!property) return [];

  const extractUrls = (urls) => {
    if (!urls) return [];

    const urlArray = Array.isArray(urls) ? urls : [urls];

    return urlArray
      .filter((url) => url && typeof url === "string")
      .map((rawUrl) => {
        let url = rawUrl.trim();

        // Case 1: If protocol exists but not at the start (e.g. "cloudfront.nethttps://...")
        const protocolIndex = Math.max(
          url.lastIndexOf("http://"),
          url.lastIndexOf("https://")
        );
        if (protocolIndex > 0) {
          url = url.substring(protocolIndex);
        }

        // Case 2: Add https if missing
        else if (!url.startsWith("http://") && !url.startsWith("https://")) {
          if (url.match(/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/)) {
            url = `https://${url}`;
          }
        }

        // Case 3: Remove duplicate protocols if any
        url = url.replace(/(https?:\/\/)+/g, "$1");

        // Final validation
        try {
          new URL(url);
          return url;
        } catch {
          console.warn(`Invalid URL skipped: ${rawUrl}`);
          return null;
        }
      })
      .filter((url) => url !== null);
  };

  return [
    ...extractUrls(property.newImageUrls),
    ...extractUrls(property.imageUrls),
  ];
};

// 🔹 Main function that tries cache first, else falls back to fetch
export const getProperties = async () => {
  const cachedProperties = await getCachedProperties();
  if (cachedProperties) {
    return cachedProperties;
  }

  return await fetchPropertiesFromAPI();
};

// 🔹 Returns grouped properties for display
export const getCategorizedProperties = async () => {
  const properties = await getProperties();

  const regularProperties = properties.filter(
    (property) => getPropertyTag(property.createdAt) === "Regular Property"
  );
  const approvedProperties = properties.filter(
    (property) => getPropertyTag(property.createdAt) === "Approved Property"
  );
  const wealthProperties = properties.filter(
    (property) => getPropertyTag(property.createdAt) === "Wealth Property"
  );
  const listedProperties = properties.filter(
    (property) => getPropertyTag(property.createdAt) === "Listed Property"
  );

  return {
    regularProperties,
    approvedProperties,
    wealthProperties,
    listedProperties,
  };
};
