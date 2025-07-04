import React, { useRef, useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Dimensions, Platform, TouchableOpacity } from "react-native";
import LazyImage from "./LazyImage";

const { width } = Dimensions.get("window");

const PropertyImageSlider = ({ property, width: sliderWidth = width }) => {
  const scrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  const normalizeImageSources = (property) => {
    if (!property) return [];

    if (Array.isArray(property.newImageUrls)) {
      return property.newImageUrls.filter(url => url && typeof url === "string");
    } else if (typeof property.newImageUrls === "string" && property.newImageUrls) {
      return [property.newImageUrls];
    }

    if (Array.isArray(property.imageUrls)) {
      return property.imageUrls.filter(url => url && typeof url === "string");
    } else if (typeof property.imageUrls === "string" && property.imageUrls) {
      return [property.imageUrls];
    }

    return [];
  };

  const images = normalizeImageSources(property);

  // Reset index on property change
  useEffect(() => {
    setCurrentIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [property]);

  // Auto-scroll effect
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      if (isAutoScrolling) {
        const nextIndex = (currentIndex + 1) % images.length;
        setCurrentIndex(nextIndex);
        scrollRef.current?.scrollTo({
          x: nextIndex * sliderWidth,
          animated: true,
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex, images.length, sliderWidth, isAutoScrolling]);

  const handleManualScroll = (newIndex) => {
    setIsAutoScrolling(false);
    setCurrentIndex(newIndex);
    scrollRef.current?.scrollTo({
      x: newIndex * sliderWidth,
      animated: true,
    });
    setTimeout(() => setIsAutoScrolling(true), 5000);
  };

  // If no images, show placeholder
  if (images.length === 0) {
    return (
      <LazyImage
        source={require("../assets/logo.png")}
        style={{ width: sliderWidth, height: 200, borderRadius: 10 }}
        resizeMode="contain"
      />
    );
  }

  // Single image view
  if (images.length === 1) {
    return (
      <LazyImage
        source={{ uri: images[0] }}
        style={{ width: sliderWidth, height: 200, borderRadius: 10 }}
        resizeMode="cover"
        cacheKey={`property_${property._id}_0`}
      />
    );
  }

  return (
    <View style={{ marginBottom: 10 }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={Platform.OS !== "web"}
        snapToInterval={sliderWidth}
        snapToAlignment="center"
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const offsetX = e.nativeEvent.contentOffset.x;
          const newIndex = Math.round(offsetX / sliderWidth);
          handleManualScroll(newIndex);
        }}
      >
        {images.map((uri, index) => (
          <LazyImage
            key={index}
            source={{ uri }}
            style={{ width: sliderWidth, height: 200, borderRadius: 10 }}
            resizeMode="cover"
            cacheKey={`property_${property._id}_${index}`}
          />
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {images.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dot,
              index === currentIndex ? styles.activeDot : null,
            ]}
            onPress={() => handleManualScroll(index)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pagination: {
    flexDirection: "row",
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    margin: 5,
  },
  activeDot: {
    backgroundColor: "#000",
  },
});

export default PropertyImageSlider;
