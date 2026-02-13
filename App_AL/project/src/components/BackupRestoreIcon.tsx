import React from "react";

type Props = {
  size?: number;
  /** 'half' = 180°, 'full' = 360°, null = sin animación */
  spin?: "half" | "full" | null;
  /** Ruta al PNG (default a tu carpeta pública) */
  src?: string;
};

export const BackupRestoreIcon: React.FC<Props> = ({
  size = 22,
  spin = null,
  src = "/assets/icons/Badkup-icon.png",
}) => {
  const cls =
    spin === "half"
      ? "alc-backup-icon alc-rotate-180"
      : spin === "full"
      ? "alc-backup-icon alc-rotate-360"
      : "alc-backup-icon";

  return (
    <img
      src={src}
      alt="Respaldo"
      className={cls}
      width={size}
      height={size}
      draggable={false}
    />
  );
};
