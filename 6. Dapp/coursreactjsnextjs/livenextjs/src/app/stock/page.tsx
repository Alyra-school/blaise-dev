'use client';
import { useState, useEffect } from "react";

const StockPage = () => {

    const [data, setData] = useState<string[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async() => {
            try {
                const response = await fetch('https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/main/nyse/nyse_tickers.json');

                if(!response.ok) {
                    throw new Error('Error getting the stocks');
                }

                const result: string[] = await response.json();
                setData(result);
            }
            catch(error) {
                console.log(error);
            }
            finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [])


    return (
        <div>
            {loading ? (
                <div>Loading...</div>
            ) : (
                <ul>
                    {data?.map((indice) => (
                        <li key={crypto.randomUUID()}>{indice}</li>
                    ))}
                </ul>
            )
            }
        </div>
    )
}

export default StockPage