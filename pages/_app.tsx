import Head from "next/head"
import { css, Global } from "@emotion/react"

function MyApp({ Component, pageProps }: any) {
  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Yellowtail:wght@400&display=swap"
          rel="stylesheet"
        />

        <link
          href="https://api.mapbox.com/mapbox-gl-js/v2.4.1/mapbox-gl.css"
          rel="stylesheet"
        />
      </Head>
      <Global
        styles={css`
          *,
          body,
          *:before,
          *:after {
            margin: 0;
            box-sizing: border-box;
          }
        `}
      />
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
