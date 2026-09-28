import React, { useState } from "react";

const Main = () => {
  // this is a 
  function detectUrlType(value) {
    if (typeof value !== "string" || !value.trim()) {
      return {
        isUrl: false,
        type: "text",
        url: null,
      };
    }

    const input = value.trim();

    // Check whether it is a valid URL
    let url;

    try {
      // Add https:// temporarily if protocol is missing
      const urlToCheck = /^https?:\/\//i.test(input)
        ? input
        : `https://${input}`;

      url = new URL(urlToCheck);

      // Only allow http/https
      if (!["http:", "https:"].includes(url.protocol)) {
        return {
          isUrl: false,
          type: "text",
          url: null,
        };
      }
    } catch {
      return {
        isUrl: false,
        type: "text",
        url: null,
      };
    }

    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");

    // YouTube
    if (
      hostname === "youtube.com" ||
      hostname === "youtu.be" ||
      hostname.endsWith(".youtube.com")
    ) {
      return {
        isUrl: true,
        type: "youtube",
        url: input,
      };
    }

    // Facebook
    if (
      hostname === "facebook.com" ||
      hostname.endsWith(".facebook.com") ||
      hostname === "fb.watch"
    ) {
      return {
        isUrl: true,
        type: "facebook",
        url: input,
      };
    }

    // Instagram
    if (hostname === "instagram.com" || hostname.endsWith(".instagram.com")) {
      return {
        isUrl: true,
        type: "instagram",
        url: input,
      };
    }

    // TeraBox
    if (
      hostname === "terabox.com" ||
      hostname.endsWith(".terabox.com") ||
      hostname === "1024terabox.com" ||
      hostname.endsWith(".1024terabox.com")
    ) {
      return {
        isUrl: true,
        type: "terabox",
        url: input,
      };
    }

    // Valid URL but unknown platform
    return {
      isUrl: true,
      type: "other",
      url: input,
    };
  }
  const [url, setUrl] = useState("");
  console.log(url);
  return (
    <>
      <input
        type="text"
        placeholder=" Enter your any video url"
        onChange={(e) => setUrl(e.target.value)}
      />
    </>
  );
};

export default Main;
