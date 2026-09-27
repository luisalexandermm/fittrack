# Correos de Supabase en español

Supabase envía los correos en inglés por defecto. Cámbialos en
**Authentication → Emails → Templates** (o *Email Templates*).

---

## Confirm signup (confirmar registro)

**Asunto:** `Confirma tu cuenta de FitTrack`

```html
<h2 style="font-family:Arial,sans-serif">Bienvenido a FitTrack</h2>
<p style="font-family:Arial,sans-serif">Toca el botón para confirmar tu correo y empezar a entrenar.</p>
<p><a href="{{ .ConfirmationURL }}" style="background:#9C4A2F;color:#FAF9F6;padding:12px 22px;border-radius:4px;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold">Confirmar mi cuenta</a></p>
<p style="font-family:Arial,sans-serif;color:#8B877F;font-size:13px">Si no creaste una cuenta en FitTrack, ignora este correo.</p>
```

## Reset password (recuperar contraseña)

**Asunto:** `Crea una nueva contraseña para FitTrack`

```html
<h2 style="font-family:Arial,sans-serif">Recupera tu acceso</h2>
<p style="font-family:Arial,sans-serif">Toca el botón para crear una contraseña nueva. El enlace vence pronto.</p>
<p><a href="{{ .ConfirmationURL }}" style="background:#151311;color:#F2F1ED;padding:12px 22px;border-radius:4px;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold">Crear nueva contraseña</a></p>
<p style="font-family:Arial,sans-serif;color:#8B877F;font-size:13px">Si no pediste esto, ignora el correo: tu contraseña sigue igual.</p>
```

---

> **Límite de correos:** el servidor de correo gratuito de Supabase envía muy pocos correos por hora y está pensado para pruebas.
> Antes de publicar, configura tu propio SMTP en **Authentication → Emails → SMTP Settings**
> (Resend, Brevo, SendGrid, Gmail Workspace, etc.).
