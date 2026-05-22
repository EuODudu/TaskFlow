import { cn } from "@/lib/utils";
import { Avatar2D, type AvatarSize } from "./avatar-2d";
import type { UserAvatar } from "@/lib/queries";

type Props = {
  avatar?: UserAvatar | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZE_MAP = {
  xs: { avatar: "xs" },
  sm: { avatar: "sm" },
  md: { avatar: "md" },
  lg: { avatar: "lg" },
  xl: { avatar: "xl" },
};

export function AvatarDisplay({ avatar, size = "md", className }: Props) {
  const s = SIZE_MAP[size];

  return (
    <Avatar2D
      avatar={avatar}
      size={s.avatar as AvatarSize}
      animate={false}
      className={cn("drop-shadow-sm", className)}
    />
  );
}
