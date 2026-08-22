import { Body, Column, Container, Head, Heading, Html, Img, Preview, Row, Section, Text } from '@react-email/components'

type AppointmentScheduledEmailProps = {
  patientName: string
  kindLabel: string
  date: string
  time: string
  clinicName: string
  logoUrl: string
  address?: string | null
  phone?: string | null
  folio?: string | null
}

const styles = {
  body: { backgroundColor: '#f8f2f4', color: '#30252b', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', margin: '0', padding: '32px 12px' },
  container: { backgroundColor: '#fffdfd', border: '1px solid #f0dce8', borderRadius: '18px', margin: '0 auto', maxWidth: '560px', overflow: 'hidden' },
  header: { backgroundColor: '#fff4fa', borderBottom: '4px solid #e20486', padding: '32px 36px 28px' },
  logo: { display: 'block', height: '36px', width: '36px' },
  brand: { color: '#e20486', fontSize: '15px', fontWeight: '700', letterSpacing: '0.08em', lineHeight: '20px', margin: '10px 0 0', textTransform: 'uppercase' as const },
  content: { padding: '32px 36px 36px' },
  badge: { backgroundColor: '#e20486', borderRadius: '999px', color: '#ffffff', display: 'inline-block', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', lineHeight: '16px', margin: '0 0 18px', padding: '5px 10px', textTransform: 'uppercase' as const },
  heading: { color: '#2b2026', fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px', lineHeight: '34px', margin: '0 0 14px' },
  intro: { color: '#5d4d55', fontSize: '16px', lineHeight: '25px', margin: '0 0 26px' },
  details: { backgroundColor: '#fff8fb', border: '1px solid #f2dce9', borderRadius: '12px', padding: '8px 20px' },
  detailRow: { borderBottom: '1px solid #f2e3eb', padding: '14px 0' },
  detailRowLast: { padding: '14px 0' },
  label: { color: '#8b6f7e', fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em', lineHeight: '18px', margin: '0', textTransform: 'uppercase' as const },
  value: { color: '#33252c', fontSize: '15px', fontWeight: '600', lineHeight: '22px', margin: '0', textAlign: 'right' as const },
  footer: { color: '#8b6f7e', fontSize: '12px', lineHeight: '18px', margin: '22px 0 0', textAlign: 'center' as const },
}

function DetailRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return <Row style={last ? styles.detailRowLast : styles.detailRow}><Column><Text style={styles.label}>{label}</Text></Column><Column align="right"><Text style={styles.value}>{value}</Text></Column></Row>
}

export function AppointmentScheduledEmail({ patientName, kindLabel, date, time, clinicName, logoUrl, address, phone, folio }: AppointmentScheduledEmailProps) {
  const confirmed = kindLabel === 'Cita clínica' ? 'confirmada' : 'confirmado'
  const details = [
    ['Fecha', date],
    ['Hora', time],
    ['Clínica', clinicName],
    ...(folio ? [['Folio', folio]] : []),
    ...(address ? [['Dirección', address]] : []),
    ...(phone ? [['Teléfono', phone]] : []),
  ]

  return (
    <Html lang="es">
      <Head />
      <Preview>{kindLabel} {confirmed} para el {date}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img src={logoUrl} alt="Vitae" width="36" height="36" style={styles.logo} />
            <Text style={styles.brand}>Vitae</Text>
          </Section>
          <Section style={styles.content}>
            <Text style={styles.badge}>{kindLabel} · {confirmed}</Text>
            <Heading style={styles.heading}>{kindLabel} {confirmed}</Heading>
            <Text style={styles.intro}>Hola {patientName}, tu {kindLabel.toLowerCase()} está {confirmed}. Te esperamos con los siguientes datos.</Text>
            <Section style={styles.details}>
              {details.map(([label, value], index) => <DetailRow key={label} label={label} value={value} last={index === details.length - 1} />)}
            </Section>
            <Text style={styles.footer}>Este es un mensaje de confirmación. No necesitas realizar ninguna acción.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
