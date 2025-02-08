"use client"
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { Input } from './ui/input'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { getFiles } from '@/lib/actions/file.actions'
import { Models } from 'node-appwrite'
import ThumbNail from './ThumbNail'
import FormattedDateTime from './FormattedDateTime'
import { useDebounce } from 'use-debounce';
const Search = () => {
  const [query, setQuery] = useState('')
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get("query") || ""
  const [results, setResults] = useState<Models.Document | []>([])
  const [debouncedQuery] = useDebounce(query, 300);
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const path = usePathname()
  useEffect(() => {
    const fetchFiles = async () => {
      if(debouncedQuery.length===0){
        setResults([])
        setOpen(false)
        return router.push(path.replace(searchParams.toString(),''))
      }
      const files = await getFiles({ types:[],searchText: query })
      setResults(files.documents)
      setOpen(true)
    }
    fetchFiles()
  }, [debouncedQuery])

  useEffect(() => {
    if (!searchQuery) {
      setQuery('')
    }
  }, [searchQuery])

  const handleClickItem = (file: Models.Document) => {
    setOpen(false)
    setResults([])
    router.push(`/${file.type === "video" || file.type === "audio" ? 'media' : file.type + 's'}?query=${query}`)
  }
  return (
    <div className='search'>
      <div className='search-input-wrapper'>
        <Image src="/assets/icons/search.svg" alt='Search' width={24} height={24} />

        <Input value={query} placeholder='Search...' className='search-input' onChange={(e) => setQuery(e.target.value)} />
        {
          open && (
            <ul className='search-result'>
              {
                results.length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  results.map((file:any) => (
                    <li key={file.$id} className='flex justify-between items-center' onClick={()=>handleClickItem(file)}>
                      <div className='flex cursor-pointer gap-4'>
                        <ThumbNail type={file.type} extension={file.extension} url={file.url} className='size-9 min-w-9' />

                        <p className='subtitle-2 line-clamp-1 text-light-100'>{file.name}</p>
                        <FormattedDateTime date={file.$createdAt} className='caption line-clamp-1 text-light-200' />
                      </div>
                    </li>
                  ))
                ) : <p className='empty-result'>No files found</p>
              }
            </ul>
          )
        }
      </div>
    </div>
  )
}

export default Search
