import { LayoutLegal } from './LayoutLegal'
import { MarkdownLegal } from './renderizadorMarkdown'

const CONTENIDO = `# Términos de Servicio

**Última actualización:** 2 de octubre de 2026

Estos Términos de Servicio regulan el uso de los productos y servicios de ANAYA INGENIERÍA, TECNOLOGÍA E INNOVACIÓN SpA ("AnayaDev"), en particular la plataforma **Calenzia**.

## 1. Identificación del prestador

- **Razón social:** ANAYA INGENIERÍA, TECNOLOGÍA E INNOVACIÓN SpA
- **RUT:** 78.510.665-2
- **Domicilio:** Antonio Bellet 193, Oficina 1210, Providencia, Santiago, Chile
- **Contacto:** contacto@anayadev.cl

## 2. Descripción del servicio

Calenzia es una plataforma en línea de agendamiento de citas y gestión para negocios de servicios. Permite a los negocios administrar su agenda, sus clientes, sus comunicaciones (incluido WhatsApp) y otras herramientas relacionadas.

## 3. Registro y cuenta

Para usar Calenzia, el negocio debe registrarse y proporcionar información veraz y actualizada. El titular de la cuenta es responsable de mantener la confidencialidad de sus credenciales y de la actividad realizada bajo su cuenta.

## 4. Uso aceptable

El usuario se compromete a usar Calenzia de forma lícita y a no:
- Usar la plataforma para fines ilegales o no autorizados.
- Vulnerar la seguridad del servicio o de otros usuarios.
- Enviar comunicaciones no solicitadas (spam) a través de las herramientas de la plataforma.
- Usar los datos de terceros de forma contraria a la ley de protección de datos.

## 5. Suscripción y pagos

El uso de Calenzia está sujeto al pago de una suscripción según el plan contratado. Los precios, condiciones y medios de pago se informan al momento de la contratación. El impago puede derivar en la suspensión del servicio según las condiciones vigentes.

## 6. Responsabilidad sobre los datos de clientes finales

Cada negocio (tenant) es el responsable del tratamiento de los datos de sus propios clientes finales que gestiona a través de Calenzia. AnayaDev actúa como proveedor tecnológico que facilita esa gestión. El negocio se compromete a cumplir la normativa de protección de datos aplicable respecto de sus clientes.

## 7. Comunicaciones por WhatsApp

El uso de la integración con WhatsApp está sujeto además a las políticas de Meta y de WhatsApp Business. El negocio es responsable de obtener el consentimiento de sus clientes para comunicarse con ellos por ese canal, conforme a las reglas de la plataforma.

## 8. Disponibilidad del servicio

Procuramos mantener el servicio disponible de forma continua, pero no garantizamos una disponibilidad ininterrumpida. Podemos realizar mantenimientos o actualizaciones que afecten temporalmente el acceso.

## 9. Limitación de responsabilidad

AnayaDev no será responsable por daños indirectos derivados del uso o la imposibilidad de uso del servicio, en la medida que lo permita la ley. El servicio se presta "tal cual", sin garantías más allá de las establecidas por la normativa aplicable.

## 10. Terminación

El usuario puede dar de baja su cuenta en cualquier momento. AnayaDev puede suspender o terminar el servicio ante incumplimientos de estos términos.

## 11. Legislación aplicable

Estos términos se rigen por las leyes de la República de Chile. Cualquier controversia se someterá a los tribunales competentes de Santiago.

## 12. Contacto

Para consultas sobre estos términos, escríbenos a **contacto@anayadev.cl**.`

export function PaginaTerminos() {
  return (
    <LayoutLegal
      titulo="Términos de Servicio"
      descripcion="Términos que regulan el uso de los productos y servicios de AnayaDev, incluida la plataforma Calenzia."
    >
      <MarkdownLegal contenido={CONTENIDO} />
    </LayoutLegal>
  )
}
