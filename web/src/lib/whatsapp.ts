export function whatsappHref(phone: string | null | undefined, text: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function profileWhatsappText(siteName: string): string {
  return `Hola ${siteName}, quiero hacer una consulta.`;
}

export function publicationWhatsappText(siteName: string, title: string): string {
  return `Hola ${siteName}, vi tu publicación "${title}" y quisiera consultar.`;
}
