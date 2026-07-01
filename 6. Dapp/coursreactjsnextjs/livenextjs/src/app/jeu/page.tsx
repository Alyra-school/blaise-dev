'use client';
import { useState, useEffect } from "react"
import Link from "next/link";

const JeuPage = () => {

    const [number, setNumber] = useState(0);
    // number = nom de la variable
    // setNumber = la fonction qui permettra de modifier cette variable

    const increment = () => {
        setNumber((number) => number + 1)
    }

    const decrement = () => {
        setNumber((number) => number - 1);
    }

    // Qu'est ce qu'il se passe lorsque le state "number" change ?
    useEffect(() => {
        console.log('Number a changé');
    }, [number])

    // Qu'est ce qu'il se passe lorsque le composant est monté ?
    useEffect(() => {
        console.log('Hello, tu viens juste d\'arriver sur la page');
    }, [])

    // Qu'est ce qu'il se passe lorsque quelque chose a changé ?
    useEffect(() => {
        console.log('Quelque chose a changé');
    });

    // Qu'est ce qu'il se passe lorsque le composant est démonté ? 
    // Qu'est ce qu'on fait quand on a plus besoin de ce composant (par exemple, l'utilisateur est retourné sur la "/")
    useEffect(() => {
        return () => {
            console.log("Le composant est démonté");
        }
    }, [])

    return (
        <div>
            {number}
            <button onClick={increment}>Increment</button>
            <button onClick={decrement}>Decrement</button>
            <Link href="/">Retour sur la page Home</Link>
        </div>
    )
}

export default JeuPage