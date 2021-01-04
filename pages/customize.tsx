import { useRouter } from "next/router"
import { CanvasCustomizer } from "components/CanvasCustomizer"
import Spinner from "components/Spinner"
import Box from "components/Box"
import { useStravaData } from "utils/useStravaData"

interface Props {}

const CustomizePage = ({}: Props) => {
  const { activities, isLoggedIn } = useStravaData()
  const router = useRouter()

  if (isLoggedIn === false) {
    router.push("/")
  }

  return activities ? (
    <CanvasCustomizer activities={activities} />
  ) : (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      width="100vw"
    >
      <Spinner />
    </Box>
  )
}

export default CustomizePage
