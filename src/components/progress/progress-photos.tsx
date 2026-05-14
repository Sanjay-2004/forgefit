import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useProgressPhotos, useUploadPhoto } from '@/lib/hooks';

type PoseType = 'front' | 'side' | 'back';

export function ProgressPhotosView() {
  const { data: photos = [], isLoading } = useProgressPhotos();
  const uploadPhoto = useUploadPhoto();
  const [selectedPose, setSelectedPose] = useState<PoseType>('front');

  async function handleTakePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required for progress photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadPhoto.mutate({
        uri: result.assets[0].uri,
        poseType: selectedPose,
      });
    }
  }

  async function handlePickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadPhoto.mutate({
        uri: result.assets[0].uri,
        poseType: selectedPose,
      });
    }
  }

  const filteredPhotos = photos.filter((p) => p.pose_type === selectedPose);

  return (
    <View>
      {/* Pose Selector */}
      <View className="flex-row gap-2 mb-4">
        {(['front', 'side', 'back'] as const).map((pose) => (
          <Pressable
            key={pose}
            onPress={() => setSelectedPose(pose)}
            className={`flex-1 py-3 rounded-xl items-center ${
              selectedPose === pose ? 'bg-accent-purple' : 'bg-bg-card'
            }`}
          >
            <Text
              className={`font-semibold text-sm capitalize ${
                selectedPose === pose ? 'text-white' : 'text-text-secondary'
              }`}
            >
              {pose}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Photo Actions */}
      <View className="flex-row gap-3 mb-4">
        <Pressable
          onPress={handleTakePhoto}
          className="flex-1 bg-accent-purple rounded-xl py-3 flex-row items-center justify-center active:opacity-80"
        >
          <Ionicons name="camera" size={18} color="#fff" />
          <Text className="text-white font-semibold text-sm ml-2">Take Photo</Text>
        </Pressable>
        <Pressable
          onPress={handlePickPhoto}
          className="flex-1 bg-bg-card rounded-xl py-3 flex-row items-center justify-center active:opacity-80"
        >
          <Ionicons name="images" size={18} color="#94A3B8" />
          <Text className="text-text-secondary font-semibold text-sm ml-2">Gallery</Text>
        </Pressable>
      </View>

      {/* Photo Grid */}
      {filteredPhotos.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {filteredPhotos.map((photo) => (
            <View key={photo.id} className="w-[48%] aspect-[3/4] rounded-xl overflow-hidden">
              <Image
                source={{ uri: photo.photo_url }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                <Text className="text-white text-xs">
                  {new Date(photo.taken_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View className="items-center py-12 bg-bg-card rounded-2xl">
          <Ionicons name="camera-outline" size={48} color="#64748B" />
          <Text className="text-text-secondary text-sm mt-3 text-center">
            No {selectedPose} photos yet.{'\n'}Take your first progress photo!
          </Text>
        </View>
      )}

      {/* Comparison View */}
      {filteredPhotos.length >= 2 && (
        <View className="mt-4 bg-bg-card rounded-2xl p-4">
          <Text className="text-text-muted text-xs uppercase tracking-widest font-bold mb-3">
            Progress Comparison
          </Text>
          <View className="flex-row gap-2">
            <View className="flex-1 aspect-[3/4] rounded-xl overflow-hidden">
              <Image
                source={{ uri: filteredPhotos[filteredPhotos.length - 1].photo_url }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                <Text className="text-white text-xs font-bold">First</Text>
              </View>
            </View>
            <View className="flex-1 aspect-[3/4] rounded-xl overflow-hidden">
              <Image
                source={{ uri: filteredPhotos[0].photo_url }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                <Text className="text-white text-xs font-bold">Latest</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
