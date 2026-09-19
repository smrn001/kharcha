import { Icon } from '@expo/ui';
import type { ImageSourcePropType } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

type NativeIconSource = SFSymbol | ImageSourcePropType;

const ELLIPSIS = Icon.select({
  ios: 'ellipsis',
  android: import('@expo/material-symbols/more_horiz.xml'),
});

export const CATEGORY_ICONS = [
  'Utensils',
  'ShoppingBag',
  'ShoppingCart',
  'Bus',
  'Car',
  'Fuel',
  'Home',
  'Receipt',
  'Landmark',
  'Clapperboard',
  'HeartPulse',
  'Stethoscope',
  'GraduationCap',
  'BookOpen',
  'Plane',
  'Wifi',
  'Smartphone',
  'Zap',
  'Droplets',
  'Coffee',
  'Music',
  'PartyPopper',
  'Dumbbell',
  'Shirt',
  'PawPrint',
  'Baby',
  'Dog',
  'Repeat',
  'User',
  'Users',
  'Wallet',
  'Banknote',
  'CreditCard',
  'ShieldCheck',
  'Sparkles',
  'Church',
  'Lightbulb',
  'Settings',
  'MoreHorizontal',
  'BriefcaseBusiness',
  'Laptop',
  'Building2',
  'TrendingUp',
  'PiggyBank',
  'Gift',
  'HandCoins',
  'Award',
  'Send',
  'Undo2',
] as const;

type CategoryIconName = (typeof CATEGORY_ICONS)[number];

const ICON_MAP: Record<CategoryIconName, NativeIconSource> = {
  Utensils: Icon.select({
    ios: 'fork.knife',
    android: import('@expo/material-symbols/restaurant.xml'),
  }),
  ShoppingBag: Icon.select({
    ios: 'bag',
    android: import('@expo/material-symbols/shopping_bag.xml'),
  }),
  ShoppingCart: Icon.select({
    ios: 'cart',
    android: import('@expo/material-symbols/shopping_cart.xml'),
  }),
  Bus: Icon.select({
    ios: 'bus',
    android: import('@expo/material-symbols/directions_bus.xml'),
  }),
  Car: Icon.select({
    ios: 'car',
    android: import('@expo/material-symbols/directions_car.xml'),
  }),
  Fuel: Icon.select({
    ios: 'fuelpump',
    android: import('@expo/material-symbols/local_gas_station.xml'),
  }),
  Home: Icon.select({
    ios: 'house',
    android: import('@expo/material-symbols/house.xml'),
  }),
  Receipt: Icon.select({
    ios: 'receipt',
    android: import('@expo/material-symbols/receipt_long.xml'),
  }),
  Landmark: Icon.select({
    ios: 'building.columns',
    android: import('@expo/material-symbols/account_balance.xml'),
  }),
  Clapperboard: Icon.select({
    ios: 'film',
    android: import('@expo/material-symbols/movie.xml'),
  }),
  HeartPulse: Icon.select({
    ios: 'bolt.heart',
    android: import('@expo/material-symbols/monitor_heart.xml'),
  }),
  Stethoscope: Icon.select({
    ios: 'stethoscope',
    android: import('@expo/material-symbols/stethoscope.xml'),
  }),
  GraduationCap: Icon.select({
    ios: 'graduationcap',
    android: import('@expo/material-symbols/school.xml'),
  }),
  BookOpen: Icon.select({
    ios: 'book',
    android: import('@expo/material-symbols/menu_book.xml'),
  }),
  Plane: Icon.select({
    ios: 'airplane',
    android: import('@expo/material-symbols/flight.xml'),
  }),
  Wifi: Icon.select({
    ios: 'wifi',
    android: import('@expo/material-symbols/wifi.xml'),
  }),
  Smartphone: Icon.select({
    ios: 'smartphone',
    android: import('@expo/material-symbols/devices.xml'),
  }),
  Zap: Icon.select({
    ios: 'bolt',
    android: import('@expo/material-symbols/bolt.xml'),
  }),
  Droplets: Icon.select({
    ios: 'drop',
    android: import('@expo/material-symbols/water_drop.xml'),
  }),
  Coffee: Icon.select({
    ios: 'cup.and.saucer',
    android: import('@expo/material-symbols/coffee.xml'),
  }),
  Music: Icon.select({
    ios: 'music.note',
    android: import('@expo/material-symbols/music_note.xml'),
  }),
  PartyPopper: Icon.select({
    ios: 'party.popper',
    android: import('@expo/material-symbols/celebration.xml'),
  }),
  Dumbbell: Icon.select({
    ios: 'dumbbell',
    android: import('@expo/material-symbols/fitness_center.xml'),
  }),
  Shirt: Icon.select({
    ios: 'tshirt',
    android: import('@expo/material-symbols/checkroom.xml'),
  }),
  PawPrint: Icon.select({
    ios: 'pawprint',
    android: import('@expo/material-symbols/pets.xml'),
  }),
  Baby: Icon.select({
    ios: 'figure.child',
    android: import('@expo/material-symbols/child_care.xml'),
  }),
  Dog: Icon.select({
    ios: 'pawprint',
    android: import('@expo/material-symbols/pet_supplies.xml'),
  }),
  Repeat: Icon.select({
    ios: 'repeat',
    android: import('@expo/material-symbols/repeat.xml'),
  }),
  User: Icon.select({
    ios: 'person',
    android: import('@expo/material-symbols/person.xml'),
  }),
  Users: Icon.select({
    ios: 'person.2',
    android: import('@expo/material-symbols/group.xml'),
  }),
  Wallet: Icon.select({
    ios: 'wallet.pass',
    android: import('@expo/material-symbols/wallet.xml'),
  }),
  Banknote: Icon.select({
    ios: 'banknote',
    android: import('@expo/material-symbols/payments.xml'),
  }),
  CreditCard: Icon.select({
    ios: 'creditcard',
    android: import('@expo/material-symbols/credit_card.xml'),
  }),
  ShieldCheck: Icon.select({
    ios: 'checkmark.shield',
    android: import('@expo/material-symbols/verified_user.xml'),
  }),
  Sparkles: Icon.select({
    ios: 'sparkles',
    android: import('@expo/material-symbols/stars.xml'),
  }),
  Church: Icon.select({
    ios: 'cross',
    android: import('@expo/material-symbols/church.xml'),
  }),
  Lightbulb: Icon.select({
    ios: 'lightbulb',
    android: import('@expo/material-symbols/lightbulb.xml'),
  }),
  Settings: Icon.select({
    ios: 'gearshape',
    android: import('@expo/material-symbols/settings.xml'),
  }),
  MoreHorizontal: Icon.select({
    ios: 'ellipsis',
    android: import('@expo/material-symbols/more_horiz.xml'),
  }),
  BriefcaseBusiness: Icon.select({
    ios: 'briefcase',
    android: import('@expo/material-symbols/work.xml'),
  }),
  Laptop: Icon.select({
    ios: 'laptopcomputer',
    android: import('@expo/material-symbols/laptop_mac.xml'),
  }),
  Building2: Icon.select({
    ios: 'building.2',
    android: import('@expo/material-symbols/apartment.xml'),
  }),
  TrendingUp: Icon.select({
    ios: 'chart.line.uptrend.xyaxis',
    android: import('@expo/material-symbols/trending_up.xml'),
  }),
  PiggyBank: Icon.select({
    ios: 'banknote',
    android: import('@expo/material-symbols/savings.xml'),
  }),
  Gift: Icon.select({
    ios: 'gift',
    android: import('@expo/material-symbols/redeem.xml'),
  }),
  HandCoins: Icon.select({
    ios: 'hand.raised',
    android: import('@expo/material-symbols/currency_exchange.xml'),
  }),
  Award: Icon.select({
    ios: 'rosette',
    android: import('@expo/material-symbols/military_tech.xml'),
  }),
  Send: Icon.select({
    ios: 'paperplane',
    android: import('@expo/material-symbols/send.xml'),
  }),
  Undo2: Icon.select({
    ios: 'arrow.uturn.backward',
    android: import('@expo/material-symbols/undo.xml'),
  }),
};

export function categoryIcon(name: string | undefined): NativeIconSource {
  if (name && name in ICON_MAP) {
    return ICON_MAP[name as CategoryIconName];
  }
  return ELLIPSIS;
}