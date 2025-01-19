import { Router} from "express";
import {registerUser, loginUser, logoutUser, refreshUserToken, getCurrentUser, changeCurrentPassword, resetUserPassword} from "../controllers/user.controller.js";
import {upload} from "../middleware/multer.middleware.js"
import {verifyJWT} from "../middleware/auth.middleware.js"

const router = Router();


router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount:1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

// secured routes || if user is login  check first 
router.route("/logout").post(verifyJWT, logoutUser)

// updates the refresh token for user
router.route("/refresh-token").post(refreshUserToken)

// gets data of user only if logged in
router.route("/getdata").get(verifyJWT, getCurrentUser)

//password can be chaged if the user is logged in
router.route("/changepwd").post(verifyJWT, changeCurrentPassword)

// password forgot and want to reset using email
router.route("/forgotpwd/:type").post(resetUserPassword)





export default router;