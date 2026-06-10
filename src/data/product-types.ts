export type contents = {
  count: number
  content: string
}

export type ProductOption = {
  name: string
  price: number
}

export type product = {
  id: number
  category: string
  src: string
  altImage: string
  topSrc: string
  botSrc: string
  rightSrc: string
  nu: boolean
  header: string
  subheader: string
  text: string
  features: string
  inthebox: contents[]
  price: number
  options: ProductOption[]
  selectedOptions: Record<string, boolean>
  finalPrice: number | undefined
  in_stock?: boolean
  featured?: boolean
  shades?: { name: string; hex: string }[]
  packaging?: 'included' | 'optional'
}

export interface catalog {
  [key: string]: product[]
}
