import Link from "next/link"

const Header = () => {
  return (
    <>
        <Link className="lalala" href="/">Home</Link>
        <Link href="/cv">CV</Link>
        <Link href="/contact">Contact</Link>
    </>
  )
}

export default Header