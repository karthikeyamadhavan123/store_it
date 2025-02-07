"use server"

import { Query, ID } from "node-appwrite"
import { createAdminClient, createSessionClient } from "../appwrite"
import { appwriteConfig } from "../appwrite/config"
import { parseStringify } from "../utils"
import { cookies } from "next/headers"
import { redirect } from "next/navigation";

const handleError = (error: unknown, message: string) => {
    console.log(error, message);
    throw error

}
export const sendEmailOTP = async ({ email }: { email: string }) => {
    const { account } = await createAdminClient()
    try {
        const session = await account.createEmailToken(ID.unique(), email)
        return session.userId
    } catch (error) {
        handleError(error, "Failed to send email OTP")
    }
}
const getUserByEmail = async (email: string) => {
    const { databases } = await createAdminClient()
    const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        [Query.equal("email", [email])]
    )
    return result.total > 0 ? result.documents[0] : null
}

export const createAccount = async ({ fullName, email }: { fullName: string; email: string }) => {
    const existingUser = await getUserByEmail(email)
    const accountId = await sendEmailOTP({ email })
    if (!accountId) {
        throw new Error("Failed to send otp")
    }
    if (!existingUser) {
        const { databases } = await createAdminClient()
        await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            {
                fullName,
                email,
                avatar: "https://imgs.search.brave.com/IDbLYxaWsyWkV_0SRQA9fvvBxSdlF2S7pj83hcMSwdU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzA5LzcwLzk4LzE4/LzM2MF9GXzk3MDk4/MTgyMF96YW1VV1BR/SEJiZ0JTeGtrTEFH/QWRGVmg2Y2taYktM/aC5qcGc",
                accountId
            }
        )
    }
    return parseStringify({ accountId })
}

export const verifySecret = async ({ accountId, password }: { accountId: string, password: string }) => {
    try {
        const { account } = await createAdminClient()
        const session = await account.createSession(accountId, password)
        const cookieStore = await cookies();
        cookieStore.set("appwrite-session", session.secret, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            path: "/",
        });
        return parseStringify({ sessionId: session.$id })
    } catch (error) {
        handleError(error, "Failed to verify email OTP")
    }
}

export const getCurrentUser = async () => {
    const { databases, account } = await createSessionClient()

    const result = await account.get()
    const user = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        [Query.equal("accountId", result.$id)]
    )
    if (user.total <= 0) {
        return null
    }
    return parseStringify(user.documents[0])
}

export const signOutUser = async () => {
    const { account } = await createSessionClient()
    try {
        await account.deleteSession('current');
        const cookieStore = await cookies();
        cookieStore.delete("appwrite-session");

    } catch (error) {
        handleError(error, "failed to signout user")
    }
    finally {
        redirect("/sign-in")
    }
}

export const signInUser=async({email}:{email:string})=>{
    try {
        const existingUser= await getUserByEmail(email)
        if(existingUser){
            await sendEmailOTP({email})
            return parseStringify({accountId:existingUser.accountId})
        }
        return parseStringify({accountId:null,error:"user not found"})
    } catch (error) {
        handleError(error,"failed to login")
    }
}