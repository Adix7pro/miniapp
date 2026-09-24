
Banners · JS
// Bosh sahifadagi banner karuseli.
// Rasm bilan banner qo'shish: rasmni public/banners/ papkasiga qo'ying (tavsiya: 1200x720, 5:3)
// va { image: 'banners/fayl-nomi.jpg', link: '/categories' } ko'rinishida qo'shing.
// `image` bo'lmasa, banner brend ranglarida matn bilan chiziladi.
export const banners = [
  {
    id: 'delivery',
    titleKey: 'banner_delivery_title',
    subtitleKey: 'banner_delivery_sub',
    theme: 'orange',
    link: '/map',
  },
  {
    id: 'gift',
    titleKey: 'banner_gift_title',
    subtitleKey: 'banner_gift_sub',
    theme: 'peach',
    link: '/categories',
  },
]
 
