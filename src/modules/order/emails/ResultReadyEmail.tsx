import { Button, Container, Heading, Html, Img, Preview, Text } from '@react-email/components'

type ResultReadyEmailProps = {
  folio: string
  resultUrl: string
}

export function ResultReadyEmail({ folio, resultUrl }: ResultReadyEmailProps) {
  const logoUrl = new URL('/image.svg', resultUrl).toString()

  return (
    <Html lang="es">
      <Preview>Tus resultados del estudio {folio} están listos</Preview>
      <Container>
        <Img src={logoUrl} alt="Vitae" width={40} height={40} />
        <Text>Vitae</Text>
        <Heading>Resultados listos</Heading>
        <Text>Los resultados del estudio con folio {folio} ya están disponibles.</Text>
        <Button href={resultUrl}>Ver resultados</Button>
      </Container>
    </Html>
  )
}
