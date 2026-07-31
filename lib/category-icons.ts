import {
  BriefcaseBusiness,
  Building2,
  Bus,
  Clapperboard,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  MoreHorizontal,
  Plane,
  Receipt,
  Repeat,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Undo2,
  User,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';

const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Bus,
  ShoppingBag,
  Receipt,
  Clapperboard,
  HeartPulse,
  GraduationCap,
  Plane,
  ShoppingCart,
  Home,
  Repeat,
  User,
  Users,
  MoreHorizontal,
  BriefcaseBusiness,
  Laptop,
  Building2,
  TrendingUp,
  Gift,
  Undo2,
};

export function categoryIcon(name: string | undefined): LucideIcon {
  if (name && name in ICON_MAP) {
    return ICON_MAP[name];
  }
  return MoreHorizontal;
}
