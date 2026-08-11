import { Hero } from '../components/sections/Hero'
import { Reasons } from '../components/sections/Reasons'
import { Collections } from '../components/sections/Collections'
import { Bestsellers } from '../components/sections/Bestsellers'
import { Sizes } from '../components/sections/Sizes'
import { Trust } from '../components/sections/Trust'

export function Home() {
  return (
    <>
      <Hero />
      <Collections />
      <Bestsellers />
      <Reasons />
      <Sizes />
      <Trust />
    </>
  )
}
