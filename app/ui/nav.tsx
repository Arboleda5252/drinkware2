import Link from 'next/link';
import Image from 'next/image';
import { MdOutlineLiveHelp } from "react-icons/md";
import { AiFillProduct } from "react-icons/ai";
import { FaUser } from "react-icons/fa";
import { getUserFromSession } from "@/app/Datalibs/auth";
import LogoutButton from "./logout-button";

export default async function Nav() {
  const user = await getUserFromSession();
  return (
    <nav className="p-4 bg-black text-white space-x-4 ">
      <div className="flex flex-row">
        <div className="basis-1/2">
          <Link href={user ? "/user" : "/"}>
            <Image
              src="/Logos/Logo2Drink.png"
              alt="Logo"
              width={100}
              height={60}
              className="inline-block align-middle"
            /> 
          </Link> 
        </div>
        <div className="basis-1/2">
            <div className='flex justify-end space-x-4 text-white'>
                <div className='justify-center'>
                    <Link href="pqrs/contactenos" className='flex flex-col items-center pr-4 px-2 hover:text-sky-400' >
                        <MdOutlineLiveHelp className='text-4xl my-1'/>
                        <p>Contáctenos</p> 
                    </Link> 
                </div>
                <div className='justify-center'>
                    <Link href="/productos" className='flex flex-col items-center pr-4 px-2 hover:text-sky-400' >
                        <AiFillProduct className='text-4xl my-1'/>
                        <p>Productos</p> 
                    </Link> 
                </div>
                {user ? (
                  <div className="flex flex-col items-center pr-4 px-2 text-right hover:text-sky-400">
                    <LogoutButton />
                    <p className="text-sm font-semibold hover:text-sky-400 my-1">Cerrar Sesión</p> 
                  </div>
                ) : (
                  <div className='justify-center'>
                    <Link href="/user_account" className='flex flex-col items-center pr-4 px-2 hover:text-sky-400' >
                        <FaUser className='text-4xl my-1'/>
                        <p>Mi cuenta</p> 
                    </Link> 
                  </div>
                )}
            </div>
        </div>
      </div>
      
    </nav>
  );
}