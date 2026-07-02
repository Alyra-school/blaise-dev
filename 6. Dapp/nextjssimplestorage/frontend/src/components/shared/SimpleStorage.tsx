'use client'
import { useReadContract, useConnection, type BaseError, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config'
import { useState, useEffect } from 'react'
import { SimpleStorageEvent } from '@/types'
import { publicClient } from '@/lib/client'
import { parseAbiItem } from 'viem'
import Events from './Events'

const SimpleStorage = () => {   

    const [inputNumber, setInputNumber] = useState("");
    const [events, setEvents] = useState<SimpleStorageEvent[]>([]);

    const { data: hash, error: errorWrite, isPending: isPendingWrite, writeContract } = useWriteContract();

    const { data: myNumberFromContract, error: errorRead, isPending: isPendingRead, refetch } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getMyNumber',
    });

    const handleSubmitNumber = () => {
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'setMyNumber',
            args: [inputNumber],
        });
    }

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

    const getEvents = async() => {
        const numberChangedEvents = await publicClient.getLogs({
            address: CONTRACT_ADDRESS,
            event: parseAbiItem('event NumberChanged(address indexed by, uint256 number)'),
            fromBlock: 0n,
            toBlock: 'latest'
        })
        setEvents(numberChangedEvents.map((event) => {
            return {
                by: event.args.by as string,
                number: event.args.number?.toString() || ''
            }
        }))
    }

    useEffect(() => {
        if(isConfirmed) {
            refetch();
        }
    }, [isConfirmed])

    useEffect(() => {
        getEvents();
    }, [])

    if (isPendingRead) return <div>Loading...</div>

    if (errorRead)
    return (
      <div>
        Error: {(errorRead as unknown as BaseError).shortMessage || errorRead.message}
      </div>
    )

    return (
        <div>
            My number : {myNumberFromContract?.toString()}
            <div>
                <input type="number" onChange={(e) => setInputNumber(e.target.value)} />
                <button disabled={isPendingWrite} onClick={handleSubmitNumber}>Valider</button>
            </div>
            <Events events={events} />
            {hash && <div>Transaction Hash: {hash}</div>}
            {isConfirming && <div>Waiting for confirmation...</div>}
            {isConfirmed && <div>Transaction confirmed.</div>}
            {errorWrite && (
                <div>Error: {(errorWrite as unknown as BaseError).shortMessage || errorWrite.message}</div>
            )}
        </div>
    )
}

export default SimpleStorage