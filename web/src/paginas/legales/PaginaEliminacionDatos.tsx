import { LayoutLegal } from './LayoutLegal'
import { MarkdownLegal } from './renderizadorMarkdown'

const CONTENIDO = `# Instrucciones para la Eliminación de Datos

**Última actualización:** 2 de octubre de 2026

En ANAYA INGENIERÍA, TECNOLOGÍA E INNOVACIÓN SpA ("AnayaDev") respetamos tu derecho a solicitar la eliminación de tus datos personales de nuestros servicios, incluyendo la plataforma **Calenzia**.

## Cómo solicitar la eliminación de tus datos

Si deseas que eliminemos los datos personales asociados a tu cuenta o a tu persona, sigue estos pasos:

1. Envía un correo a **contacto@anayadev.cl** con el asunto **"Solicitud de eliminación de datos"**.
2. Indica en el correo:
   - Tu nombre completo.
   - El correo o número de teléfono asociado a tu cuenta o a tus datos.
   - Si aplica, el nombre del negocio (tenant) con el que estás vinculado.
3. Para proteger tu información, podríamos solicitarte verificar tu identidad antes de procesar la solicitud.

## Qué eliminamos

Una vez verificada tu solicitud, eliminaremos o anonimizaremos los datos personales que tengamos sobre ti, salvo aquellos que debamos conservar por obligaciones legales o tributarias (por ejemplo, registros de facturación), los cuales se conservarán solo durante el plazo exigido por la ley y luego se eliminarán.

## Datos gestionados por un negocio (tenant)

Si tus datos fueron ingresados por un negocio que usa Calenzia (por ejemplo, porque agendaste una cita con él), ese negocio es el responsable de esos datos. Podemos ayudarte a canalizar tu solicitud hacia el negocio correspondiente, o eliminarlos de nuestros sistemas según corresponda.

## Datos de WhatsApp

Si solicitas la eliminación, también se eliminarán los datos de las comunicaciones de WhatsApp asociadas a tu cuenta que estén en nuestros sistemas, conforme a lo anterior.

## Plazo

Procesaremos tu solicitud en un plazo razonable desde su verificación, conforme a la legislación aplicable.

## Contacto

Para cualquier consulta sobre la eliminación de tus datos, escríbenos a **contacto@anayadev.cl**.`

export function PaginaEliminacionDatos() {
  return (
    <LayoutLegal
      titulo="Eliminación de Datos"
      descripcion="Cómo solicitar la eliminación de tus datos personales de los servicios de AnayaDev y Calenzia."
    >
      <MarkdownLegal contenido={CONTENIDO} />
    </LayoutLegal>
  )
}
