import { Button, Container, Heading, Html, Img, Preview, Text } from '@react-email/components'

type ResultReadyEmailProps = {
  folio: string
  viewerUrl: string
  downloadUrl: string
}

export function ResultReadyEmail({ folio, viewerUrl, downloadUrl }: ResultReadyEmailProps) {
  const logoUrl = new URL('/image.svg', viewerUrl).toString()

  return (
    <Html lang="es">
      <Preview>Tus resultados del estudio {folio} están listos</Preview>
      <Container>
        <Img src={logoUrl} alt="Vitae" width={40} height={40} />
        <Text>Vitae</Text>
        <Heading>Resultados listos</Heading>
        <Text>Los resultados del estudio con folio {folio} ya están disponibles.</Text>
        <Button href={viewerUrl}>Ver resultados</Button>
        <Text>También puedes descargar los archivos del estudio.</Text>
        <Button href={downloadUrl}>Descargar resultados</Button>
      </Container>
    </Html>
  )
}
