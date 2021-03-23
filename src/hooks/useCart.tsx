import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    // const storagedCart = Buscar dados do localStorage
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const productInCart = cart.find(product => product.id === productId)
      if (productInCart) {
        const { data: stock } = await api.get<Stock>(`/stock/${productId}`);

        if (productInCart.amount < stock.amount) {
          productInCart.amount++;

          setCart([...cart])
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart]))
        } else {
          toast.error('Quantidade solicitada fora de estoque')
        }
      } else {
        const { data: product } = await api.get<Product>(`/products/${productId}`)
        const { data: stock } = await api.get<Stock>(`/stock/${productId}`)
        if (stock.amount < 1) {
          toast.error('Quantidade solicitada fora de estoque')
          return

        } else {
          product.amount = 1
          setCart([...cart, product])
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, product]))

        }
      }
    } catch (error) {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const productInCart = cart.find(product => product.id === productId)
      if (productInCart) {
        const newCartList = cart.filter(product => product.id !== productId)
        setCart(newCartList)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCartList))
      } else
        throw new Error('Erro na remoção do produto')

    } catch {
      // TODO
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({ productId, amount, }: UpdateProductAmount) => {
    try {
      if (amount < 1) throw new Error('Erro na alteração de quantidade do produto')
      const productInCart = cart.find(product => product.id === productId)
      if (!productInCart)
        throw new Error('Erro na alteração de quantidade do produto')

      const { data: stock } = await api.get<Stock>(`/stock/${productId}`);

      if (amount > stock.amount)
        throw new Error('Quantidade solicitada fora de estoque')

      productInCart.amount = amount
      const newCartList = cart.map(product => product.id === productId ? productInCart : product)
      setCart(newCartList)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCartList))

    } catch (error) {
      toast.error(error.message)
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
