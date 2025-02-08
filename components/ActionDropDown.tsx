"use client"
import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from 'next/image'
import { Models } from 'node-appwrite'
import { actionsDropdownItems } from '@/constants'
import Link from 'next/link'
import { constructDownloadUrl } from '@/lib/utils'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { deleteFile, renameFile, updateFileUsers } from '@/lib/actions/file.actions'
import { usePathname } from 'next/navigation'
import { FileDetails, ShareInput } from './ActionsModelContent'

const ActionDropDown = ({ file }: { file: Models.Document }) => {
    const [isModalOpen, setisModalOpen] = useState(false)
    const [isDropdownOpen, setisDropdownOpen] = useState(false)
    const [action, setAction] = useState<ActionType | null>(null)
    const [name, setName] = useState(file.name)
    const [isLoading, setisLoading] = useState(false)
    const [emails, setEmails] = useState<string[]>([])
    const path = usePathname()
    const closeAllModal = () => {
        setisModalOpen(false)
        setisDropdownOpen(false)
        setAction(null)
        setName(file.name)
    }
    const handleRemoveUser = async (email: string) => {
        const updatedEmails = emails.filter((e) => e !== email)
        const success = await updateFileUsers({fileId:file.$id,
            emails:updatedEmails,
            path
        })
        if(success){
            setEmails(updatedEmails)
        }
        closeAllModal()
    }
    const handleAction = async () => {
        if (!action) {
            return;
        }
        setisLoading(true)
        let success = false
        const actions = {
            rename: () => renameFile({ fileId: file.$id, name, extension: file.extension, path }),
            share: () => updateFileUsers({ fileId: file.$id, emails, path }),
            delete: () => deleteFile({fileId:file.$id,path,bucketFileId:file.bucketFileId})
        }
        success = await actions[action.value as keyof typeof actions]()
        if (success) {
            closeAllModal()
        }
        setisLoading(false)
    }
    const renderDialogContent = () => {
        if (!action) {
            return null
        }
        const { value, label } = action
        return (
            <DialogContent className='shad-dialog button'>
                <DialogHeader className='flex flex-col gap-3'>
                    <DialogTitle className='text-center text-light-100'>{label}</DialogTitle>
                    {value === "rename" && (
                        <Input type='text' value={name} onChange={(e) => setName(e.target.value)} />
                    )}
                    {value === "details" && (
                        <FileDetails file={file} />
                    )}
                    {value === "share" && (
                        <ShareInput file={file} onInputChange={setEmails} onRemove={handleRemoveUser} />
                    )}
                     {value === "delete" && (
                      <p className='delete-confirmation'>
                        Are you sure you want to delete {` `}
                        <span className='delete-file-name'>
                            {file.name}?
                        </span>
                      </p>
                    )}
                </DialogHeader>
                {["rename", "share", "delete", "details"].includes(value)
                    && (
                        <DialogFooter className='flex flex-col gap-3 md:flex-row'>
                            <Button onClick={closeAllModal} className='modal-cancel-button'>
                                Cancel
                            </Button>
                            <Button onClick={handleAction} className='modal-submit-button'>
                                <p className='capitalize'>{value}</p>
                                {
                                    isLoading && (
                                        <Image src="/assets/icons/loader.svg" alt='loader' width={24} height={24} className='animate-spin' />
                                    )
                                }
                            </Button>
                        </DialogFooter>
                    )
                }
            </DialogContent>
        )
    }
    return (
        <Dialog open={isModalOpen} onOpenChange={setisModalOpen}>
            <DropdownMenu open={isDropdownOpen} onOpenChange={setisDropdownOpen}>
                <DropdownMenuTrigger className='shad-no-focus'>
                    <Image src='/assets/icons/dots.svg' alt='dots' width={34} height={34} />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel className='max-w-[200px] truncate'>{file.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {actionsDropdownItems.map((actionItem) => (
                        <DropdownMenuItem key={actionItem.value} className='shad-dropdown-item' onClick={() => {
                            setAction(actionItem)
                            if (["rename", "share", "delete", "details"].includes(actionItem.value)) {
                                setisModalOpen(true)
                            }
                        }}>
                            {actionItem.value === "download" ? (<Link href={constructDownloadUrl(file.bucketFileId)} download={file.name} className='flex items-center gap-2'>
                                <Image src={actionItem.icon} alt={actionItem.label} width={30} height={30} />
                                {actionItem.label}
                            </Link>) : (
                                <div className='flex items-center gap-2'>
                                    <Image src={actionItem.icon} alt={actionItem.label} width={30} height={30} />
                                    {actionItem.label}
                                </div>
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            {renderDialogContent()}
        </Dialog>

    )
}

export default ActionDropDown
