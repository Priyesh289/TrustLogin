import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../model/userModel.js';
import transporter from '../config/nodeMailer.js'

//register code
export const register = async (req, res) => {
    let { name, email, password, } = req.body;

    if (!name || !email || !password) {
        return res.json({ success: false, message: 'Missing Details' })
    }

    try {
        const existingUser = await userModel.findOne({ email })

        if (existingUser) {
            return res.json({ success: false, message: "user already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new userModel({ name, email, password: hashedPassword })
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        //mail sender
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Thanks for signing up with us',
            text: `Welcome to Priyesh labs website. your account
            has been creted with eamil id : ${email}`
        }

        await transporter.sendMail(mailOptions)

        return res.json({ success: true, message: "user register successfully" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//login code
export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ success: false, message: 'Email and Password are required' })
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "invalid email" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Invalid Password" })
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })


        return res.json({ success: true, message: "user login" })

    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        return res.json({ success: true, message: 'logged out' })
    } catch (error) {
        return res.json({ success: true, message: "user login" })
    }
}

export const sendVerifyOtp = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await userModel.findById(userId);

        if (user.isAccountVerified) {
            return res.json({ success: false, message: 'Account Already verified' })
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000))

        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account Verification OTP',
            text: `Your OTP is ${otp}. Verify your accound using this OTP`
        }
        await transporter.sendMail(mailOption)

        res.json({ success: true, message: 'Verification OTP send on Email' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}


//Verify the Email or Account using OTP
export const verifyEmail = async (req, res) => {
    const { userId, otp } = req.body;              // send otp manually userId take from middleware

    if (!userId || !otp) {
        return res.json({ success: false, message: 'Missing Details' })
    }

    try {
        const user = await userModel.findById(userId);

        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }

        if (user.verifyOtp === '' || user.verifyOtp !== otp) {
            return res.json({ success: false, message: 'Invalid Otp' })
        }

        if (user.verifyOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: "OTP Expired" })
        }

        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;

        await user.save();
        return res.json({ success: true, message: "Email verified Successfull" })

    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

//Check if the user is authenticated
export const isAuthenticated = async (req, res) => {
    try {
        res.json({ success: true });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message })
    }
}

//send Password Reset otp
export const sendResetOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.json({ success: false, message: "Email is required" })
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000))

        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;
        await user.save();

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            text: `Your OTP for resetting your password is ${otp}.
            Use this OTP to process resetting your password`
        }
        await transporter.sendMail(mailOption);

        return res.json({ success: true, message: "OTP sent to your Email" })
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

//Reset User Password
export const resetPassword = async (req, res) => {
    const { email, newPassword, otp } = req.body;

    if (!email || !otp || !newPassword) {          //Bug=>I thing here should be (&) and operator
        return res.json({ success: false, message: "Email, OTP and newPassword are required" })
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }

        if (user.resetOtp == "" || user.resetOtp != otp) {
            return res.json({ success: false, message: "Invalid OTP" })
        }

        if (user.resetOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: "OTP Expired" })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0

        await user.save()
        return res.json({ success: true, message: "Password has reset successfully" })
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}