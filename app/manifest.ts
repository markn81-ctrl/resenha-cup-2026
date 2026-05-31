import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Resenha Cup 2026",
    short_name: "Resenha Cup",
    description: "Liga privada de palpites da Copa 2026.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#22c55e",
    lang: "pt-BR"
  };
}
