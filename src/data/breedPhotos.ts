/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const HAMPSHIRE_PHOTO = '/assets/breeds/hampshire.jpg';

export function getBreedPhoto(breedName: string): string {
  if (breedName.includes('เมอริโน') || breedName.toLowerCase().includes('merino')) {
    return '/assets/breeds/merino_3912.jpg';
  }
  if (breedName.includes('แฮมป์เชียร์') || breedName.toLowerCase().includes('hampshire')) {
    return HAMPSHIRE_PHOTO;
  }
  if (breedName.includes('ดอร์เซท') || breedName.toLowerCase().includes('dorset')) {
    return '/assets/breeds/dorset.jpg';
  }
  if (breedName.includes('คอร์ริเดล') || breedName.toLowerCase().includes('corriedale')) {
    return '/assets/breeds/corriedale_3917.jpg';
  }
  if (breedName.includes('ลินคอล์น') || breedName.toLowerCase().includes('lincoln')) {
    return '/assets/breeds/lincoln_3913.jpg';
  }
  if (breedName.includes('แอสคาเนียน') || breedName.toLowerCase().includes('askanian')) {
    return '/assets/breeds/askanian_3915.jpg';
  }
  if (breedName.includes('คอตส์โวลด์') || breedName.toLowerCase().includes('cotswold')) {
    return '/assets/breeds/cotswold_3916.jpg';
  }
  if (breedName.includes('แรมบูเยต์') || breedName.toLowerCase().includes('rambouillet')) {
    return '/assets/breeds/rambouillet.jpg';
  }
  if (breedName.includes('เดอบูเยต์') || breedName.toLowerCase().includes('debouillet')) {
    return '/assets/breeds/debouillet.webp';
  }
  if (breedName.includes('รอมนีย์') || breedName.toLowerCase().includes('romney')) {
    return '/assets/breeds/romney.jpg';
  }
  if (breedName.includes('โคลัมเบีย') || breedName.toLowerCase().includes('columbia')) {
    return '/assets/breeds/columbia.webp';
  }
  return '/assets/breeds/merino_3912.jpg';
}
