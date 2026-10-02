import { LayoutLegal } from './LayoutLegal'
import { MarkdownLegal } from './renderizadorMarkdown'

const CONTENIDO = `# Política de Privacidad

**Última actualización:** 2 de octubre de 2026

Esta Política de Privacidad describe cómo ANAYA INGENIERÍA, TECNOLOGÍA E INNOVACIÓN SpA ("AnayaDev", "nosotros") recopila, usa y protege la información de los usuarios de sus productos y servicios, incluyendo la plataforma **Calenzia**.

## 1. Responsable del tratamiento de datos

- **Razón social:** ANAYA INGENIERÍA, TECNOLOGÍA E INNOVACIÓN SpA
- **RUT:** 78.510.665-2
- **Domicilio:** Antonio Bellet 193, Oficina 1210, Providencia, Santiago, Chile
- **Correo de contacto para privacidad:** contacto@anayadev.cl

## 2. Qué productos cubre esta política

Esta política aplica a los servicios de AnayaDev, en particular a **Calenzia**, una plataforma de agendamiento de citas y gestión para negocios de servicios (salones de belleza, consultorios, centros de estética y similares).

En Calenzia existen dos tipos de usuarios:
- **Negocios (tenants):** los establecimientos que contratan Calenzia para gestionar sus citas, clientes y comunicaciones.
- **Clientes finales:** las personas que agendan citas con esos negocios.

## 3. Qué información recopilamos

**De los negocios (tenants):**
- Datos de identificación y contacto: nombre del negocio, RUT o identificación fiscal, correo, teléfono, dirección.
- Datos de los trabajadores que el negocio registre (nombre, correo, horarios).
- Información de configuración del negocio y su actividad.

**De los clientes finales:**
- Nombre, identificación, correo y teléfono.
- Historial de citas, servicios contratados y preferencias.
- En el caso de menores de edad, los datos de contacto de sus tutores.

**Comunicaciones por WhatsApp:**
Cuando un negocio conecta su número de WhatsApp Business a Calenzia, procesamos los mensajes intercambiados entre el negocio y sus clientes con el único fin de facilitar esa comunicación (confirmaciones de cita, recordatorios, respuestas automáticas). No usamos esos mensajes para ningún otro propósito.

**Datos técnicos:**
Dirección IP, tipo de dispositivo y datos de uso de la plataforma, para operar y mejorar el servicio.

## 4. Para qué usamos la información

- Prestar el servicio de agendamiento, gestión de citas y comunicaciones.
- Enviar notificaciones relacionadas con las citas (confirmaciones, recordatorios).
- Procesar la facturación de la suscripción de los negocios.
- Dar soporte técnico.
- Cumplir con obligaciones legales y tributarias.

## 5. Con quién compartimos la información

No vendemos ni cedemos datos personales a terceros con fines comerciales. Solo compartimos información con:
- **Proveedores de servicios** que nos permiten operar (por ejemplo, servicios de correo, de mensajería WhatsApp a través de Meta, de alojamiento en la nube y de procesamiento de pagos), bajo acuerdos de confidencialidad y solo para los fines del servicio.
- **Autoridades**, cuando la ley lo exija.

Cada negocio (tenant) es responsable de los datos de sus propios clientes finales que gestiona a través de Calenzia.

## 6. Conservación de los datos

Conservamos los datos mientras exista una relación con el usuario y durante el tiempo que las obligaciones legales lo requieran. Luego se eliminan o anonimizan.

## 7. Derechos de los usuarios

De acuerdo con la Ley N° 19.628 sobre Protección de la Vida Privada de Chile, los usuarios pueden solicitar acceder, rectificar, cancelar u oponerse al tratamiento de sus datos personales escribiendo a **contacto@anayadev.cl**.

## 8. Seguridad

Aplicamos medidas técnicas y organizativas razonables para proteger la información contra accesos no autorizados, pérdida o alteración. Las credenciales sensibles (como los tokens de WhatsApp) se almacenan de forma protegida y no se exponen.

## 9. Cambios a esta política

Podemos actualizar esta política. La versión vigente estará siempre disponible en esta página, con su fecha de última actualización.

## 10. Contacto

Para cualquier consulta sobre privacidad o sobre el tratamiento de tus datos, escríbenos a **contacto@anayadev.cl**.`

export function PaginaPrivacidad() {
  return (
    <LayoutLegal
      titulo="Política de Privacidad"
      descripcion="Cómo AnayaDev, incluyendo la plataforma Calenzia, recopila, usa y protege la información de sus usuarios."
    >
      <MarkdownLegal contenido={CONTENIDO} />
    </LayoutLegal>
  )
}
