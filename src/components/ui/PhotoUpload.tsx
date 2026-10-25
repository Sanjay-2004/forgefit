import { View, Text, Pressable, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { upload } from 'cloudinary-react-native';
import { cld, UPLOAD_PRESET } from '@/lib/cloudinary';

interface PhotoUploadProps {
  currentUrl?: string;
  onUpload: (url: string) => void;
}

export function PhotoUpload({ currentUrl, onUpload }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);

  async function pickAndUpload() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    upload(cld, {
      file: result.assets[0].uri,
      options: { upload_preset: UPLOAD_PRESET, resource_type: 'image' },
      callback: (error, response) => {
        setUploading(false);
        if (error) { console.error('Cloudinary upload error:', error); return; }
        if (response?.secure_url) onUpload(response.secure_url);
      },
    });
  }

  return (
    <Pressable
      onPress={pickAndUpload}
      disabled={uploading}
      className="rounded-2xl overflow-hidden border border-bg-tertiary active:opacity-80"
    >
      {currentUrl ? (
        <View className="relative">
          <Image source={{ uri: currentUrl }} className="w-full h-48" resizeMode="cover" />
          <View className="absolute inset-0 items-center justify-center bg-black/30">
            {uploading ? (
              <ActivityIndicator color="#00f0ff" />
            ) : (
              <Text className="text-white text-xs font-semibold tracking-wider bg-black/50 px-3 py-1 rounded-full">
                TAP TO CHANGE
              </Text>
            )}
          </View>
        </View>
      ) : (
        <View className="h-32 bg-bg-secondary items-center justify-center">
          {uploading ? (
            <ActivityIndicator color="#00f0ff" />
          ) : (
            <>
              <Text className="text-3xl mb-2">📸</Text>
              <Text className="text-text-secondary text-sm font-medium">Upload Progress Photo</Text>
              <Text className="text-text-muted text-xs mt-1">Required daily quest</Text>
            </>
          )}
        </View>
      )}
    </Pressable>
  );
}
