import Header from "./Header"
import Footer from "./Footer"

const Template = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
        <Header />
        {children}
        <Footer />
    </>
  )
}

export default Template