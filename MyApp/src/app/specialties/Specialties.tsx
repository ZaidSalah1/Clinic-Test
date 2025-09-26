// Specialties.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, Image, Pressable, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HOST } from '../constants';
import type { RootStackParamList } from '../App';

type Specialty = { _id: string; name: string; iconUrl?: string };

export default function Specialties() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${HOST}/allSpecialties`);
        const json = await res.json();
        setSpecialties(Array.isArray(json) ? json : []);
      } catch {
        setSpecialties([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#13809D" />
      {loading ? (
        <View style={{ marginTop: 10, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#13809D" />
        </View>
      ) : specialties.length === 0 ? (
        <Text style={{ padding: 16, color: '#666' }}>لا يوجد تخصصات.</Text>
      ) : (
        <FlatList
          data={specialties}
          keyExtractor={(item) => item._id}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('DoctorsBySpecialty', { name: item.name })}
              style={{
                flex: 1, backgroundColor: '#fff', margin: 5, borderRadius: 12, alignItems: 'center',
                padding: 12, paddingTop: 15, paddingBottom: 15, elevation: 4,
                shadowColor: '#00000073', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 5.5,
              }}
            >
              <View
                style={{
                  width: 60, height: 60, borderRadius: 35, backgroundColor: '#fff',
                  alignItems: 'center', justifyContent: 'center', marginBottom: 10,
                  shadowColor: '#00000077', shadowOpacity: 0.08, shadowRadius: 6,
                  shadowOffset: { width: 0, height: 3 }, elevation: 3,
                }}
              >
                {!!item.iconUrl && (
                  <Image source={{ uri: `${HOST}${item.iconUrl}` }} style={{ width: 38, height: 38 }} resizeMode="contain" />
                )}
              </View>
              <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '500', color: '#128FAF', textAlign: 'center' }}>
                {item.name}
              </Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
