"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Animated } from "react"

const BASE_URL = "https://uresources.cravii.ng/"

export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imgIsLoading, setImgIsLoading] = useState(true)
  const fadeAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setImgIsLoading(true)
        const response = await fetch(`${BASE_URL}api/get_slide_images.php`)
        const data = await response.json()
        if (response.ok && Array.isArray(data)) {
          const formattedImages = data.map(item => ({
            id: item.id,
            image_url: `${BASE_URL}api/uploads/${item.image_url.startsWith('uploads/') ? item.image_url.replace('uploads/', '') : item.image_url}`
          }))
          setImages(formattedImages)
        } else {
          console.error("Error fetching images:", data.error || "Invalid response")
          setImages([])
        }
      } catch (error) {
        console.error("Network error fetching images:", error)
        setImages([])
      } finally {
        setImgIsLoading(false)
      }
    }
    fetchImages()
  }, [])

  useEffect(() => {
    if (images.length === 0) return

    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        let newIndex
        do {
          newIndex = Math.floor(Math.random() * images.length)
        } while (newIndex === currentImageIndex && images.length > 1)
        
        setCurrentImageIndex(newIndex)
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start()
      })
    }, 30000)

    return () => clearInterval(interval)
  }, [images, fadeAnim, currentImageIndex])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate login process
    setTimeout(() => {
      setIsLoading(false)
      console.log("Login attempted with:", { email, password })
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image with Fade Effect */}
      <div className="absolute inset-0">
        {imgIsLoading ? (
          <div className="w-full h-full bg-black flex items-center justify-center">
            <div className="text-white">Loading background...</div>
          </div>
        ) : images.length > 0 ? (
          <Animated.div
            style={{
              opacity: fadeAnim,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${images[currentImageIndex].image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </Link>

        {/* Brand Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 mb-4">
            <span className="text-2xl font-bold text-white">FW</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-white/70 text-sm">Sign in to continue your quiz journey</p>
        </div>

        {/* Login Form */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-foreground">Sign In</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-input border-border focus:border-primary focus:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-input border-border focus:border-primary focus:ring-primary/20 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" className="rounded border-border text-primary focus:ring-primary/20" />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/signup" className="text-accent hover:text-accent/80 font-semibold transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Social Login Options */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-white/70">Or continue with</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button
              variant="outline"
              className="h-12 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}