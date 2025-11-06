import { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, File, X, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import * as pdfjsLib from 'pdfjs-dist'

interface BookUploadProps {
  onUploadSuccess: (book: any) => void
}

export default function BookUpload({ onUploadSuccess }: BookUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentOperation, setCurrentOperation] = useState<string>('')
  const [aiProcessing, setAiProcessing] = useState(false)
  const [aiProgress, setAiProgress] = useState<string>('')
  
  // Refs for cancellation and tracking
  const isCancelledRef = useRef(false)
  const uploadBookIdRef = useRef<string | null>(null)
  const aiCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Configure PDF.js worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (aiCheckIntervalRef.current) {
        clearInterval(aiCheckIntervalRef.current)
      }
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const file = files[0]

    if (file && (file.type === 'application/pdf' || file.type === 'application/epub+zip')) {
      if (file.size <= 50 * 1024 * 1024) {
        setSelectedFile(file)
        
        const fileSizeMB = file.size / (1024 * 1024)
        if (fileSizeMB > 20) {
          toast('Large file selected. Upload will use direct streaming.', { 
            icon: 'ℹ️',
            duration: 3000 
          })
        }
      } else {
        toast.error('File size must be less than 50MB')
      }
    } else {
      toast.error('Please upload a PDF or EPUB file')
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size <= 50 * 1024 * 1024) {
        setSelectedFile(file)
        
        const fileSizeMB = file.size / (1024 * 1024)
        if (fileSizeMB > 20) {
          toast('Large file selected. Upload will use direct streaming.', { 
            icon: 'ℹ️',
            duration: 3000 
          })
        }
      } else {
        toast.error('File size must be less than 50MB')
      }
    }
  }, [])

  const resetUploadState = () => {
    setUploading(false)
    setUploadProgress(0)
    setSelectedFile(null)
    setCurrentOperation('')
    setAiProcessing(false)
    setAiProgress('')
    uploadBookIdRef.current = null
    isCancelledRef.current = false
    
    if (aiCheckIntervalRef.current) {
      clearInterval(aiCheckIntervalRef.current)
      aiCheckIntervalRef.current = null
    }
  }

  const handleCancel = async () => {
    try {
      isCancelledRef.current = true

      if (uploadBookIdRef.current) {
        await supabase
          .from('books')
          .update({ processing_status: 'cancelled' })
          .eq('id', uploadBookIdRef.current)
      }

      toast('Upload cancelled', { icon: '⏹️' })
      resetUploadState()
    } catch (error) {
      console.error('Cancel error:', error)
      resetUploadState()
    }
  }

  // Extract text from PDF
  const extractPDFText = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      
      let fullText = ''
      const totalPages = pdf.numPages
      
      for (let pageNum = 1; pageNum <= Math.min(totalPages, 500); pageNum++) {
        if (isCancelledRef.current) {
          throw new Error('Cancelled')
        }
        
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
        
        fullText += pageText + '\n\n'
        
        if (pageNum % 10 === 0) {
          const progress = 60 + Math.round((pageNum / totalPages) * 20)
          setUploadProgress(Math.min(progress, 80))
          setCurrentOperation(`Extracting text... (${pageNum}/${totalPages} pages)`)
        }
      }
      
      return fullText
    } catch (error: any) {
      if (error.message === 'Cancelled') {
        throw error
      }
      console.error('PDF extraction error:', error)
      throw new Error('Failed to extract PDF text')
    }
  }

  // Poll AI status
  const startAiStatusCheck = (bookId: string) => {
    if (aiCheckIntervalRef.current) {
      clearInterval(aiCheckIntervalRef.current)
    }

    aiCheckIntervalRef.current = setInterval(async () => {
      try {
        const { data: book, error } = await supabase
          .from('books')
          .select('processing_status, ai_analysis, total_chapters')
          .eq('id', bookId)
          .single()

        if (error) {
          console.error('Error checking AI status:', error)
          return
        }

        if (book?.processing_status === 'completed') {
          setAiProgress('AI analysis complete!')
          setAiProcessing(false)
          toast.success(`Book analyzed! ${book.total_chapters || 0} chapters found.`)
          
          if (aiCheckIntervalRef.current) {
            clearInterval(aiCheckIntervalRef.current)
            aiCheckIntervalRef.current = null
          }
        } else if (book?.processing_status === 'failed') {
          setAiProgress('AI analysis failed')
          setAiProcessing(false)
          toast.error('AI analysis failed. You can retry from book details.')
          
          if (aiCheckIntervalRef.current) {
            clearInterval(aiCheckIntervalRef.current)
            aiCheckIntervalRef.current = null
          }
        } else if (book?.processing_status === 'analyzing' || book?.processing_status === 'processing_chapters') {
          if (book.ai_analysis) {
            setAiProgress('Generating chapters...')
          } else {
            setAiProgress('Analyzing book content...')
          }
        }
      } catch (error) {
        console.error('AI status check error:', error)
      }
    }, 3000)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    isCancelledRef.current = false
    setUploading(true)
    setUploadProgress(10)
    setCurrentOperation('Preparing upload...')

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('Please log in to upload books')
      }

      if (isCancelledRef.current) return

      const fileSizeMB = selectedFile.size / (1024 * 1024)
      console.log(`Starting direct storage upload for ${fileSizeMB.toFixed(2)}MB file`)

      setUploadProgress(20)
      setCurrentOperation(`Uploading ${fileSizeMB.toFixed(1)}MB file...`)

      // DIRECT STORAGE UPLOAD - No edge function, no base64
      const timestamp = Date.now()
      const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const storagePath = `${user.id}/${timestamp}-${sanitizedFileName}`

      // Direct upload with Supabase storage client
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('learnty-storage')
        .upload(storagePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      if (!uploadData) {
        throw new Error('Upload succeeded but no data returned')
      }

      console.log('File uploaded to storage successfully:', uploadData.path)

      if (isCancelledRef.current) return

      setUploadProgress(50)
      setCurrentOperation('Creating book record...')

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('learnty-storage')
        .getPublicUrl(storagePath)

      const publicUrl = urlData.publicUrl

      // Create book record in database
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .insert({
          user_id: user.id,
          title: selectedFile.name.replace(/\.[^/.]+$/, ''),
          author: 'Unknown',
          file_url: publicUrl,
          file_type: selectedFile.type,
          upload_date: new Date().toISOString(),
          processing_status: 'uploaded',
          ai_analysis: null
        })
        .select()
        .single()

      if (bookError) {
        console.error('Database insert error:', bookError)
        throw new Error(`Failed to create book record: ${bookError.message}`)
      }

      if (!bookData) {
        throw new Error('Book created but no data returned')
      }

      console.log('Book record created:', bookData.id)
      uploadBookIdRef.current = bookData.id

      if (isCancelledRef.current) return

      setUploadProgress(60)
      setCurrentOperation('Extracting text from PDF...')

      // Extract PDF text (client-side)
      if (selectedFile.type === 'application/pdf') {
        try {
          const extractedText = await extractPDFText(selectedFile)
          
          if (isCancelledRef.current) return

          setUploadProgress(85)
          setCurrentOperation('Starting AI analysis...')

          // Trigger AI processing asynchronously
          supabase.functions.invoke('process-book-ai-openrouter', {
            body: {
              bookId: bookData.id,
              bookText: extractedText
            }
          }).then(({ error: aiError }) => {
            if (aiError) {
              console.error('AI processing error:', aiError)
              toast.error('Failed to start AI analysis. You can retry from book details.')
              setAiProcessing(false)
            } else {
              console.log('AI analysis started successfully')
              setAiProcessing(true)
              setAiProgress('Analyzing book content...')
              startAiStatusCheck(bookData.id)
            }
          }).catch((err) => {
            console.error('AI invocation error:', err)
            setAiProcessing(false)
          })

        } catch (extractError: any) {
          if (extractError.message === 'Cancelled') {
            return
          }
          console.error('PDF extraction error:', extractError)
          toast.error('Failed to extract PDF text. Book uploaded but AI analysis incomplete.')
        }
      }

      if (isCancelledRef.current) return

      setUploadProgress(100)
      setCurrentOperation('Upload complete!')
      toast.success('Book uploaded successfully!')

      // Call achievement update
      try {
        await supabase.functions.invoke('award-achievement', {
          body: {
            userId: user.id,
            achievementType: 'milestone'
          }
        })
      } catch (achError) {
        console.log('Achievement update error (non-critical):', achError)
      }

      setTimeout(() => {
        if (!isCancelledRef.current) {
          if (!aiProcessing) {
            onUploadSuccess(bookData)
            resetUploadState()
          } else {
            setUploading(false)
            setUploadProgress(0)
            setCurrentOperation('')
            
            toast('Book is ready! AI analysis running in background.', { 
              icon: 'ℹ️',
              duration: 5000 
            })
            
            onUploadSuccess(bookData)
          }
        }
      }, 800)

    } catch (error: any) {
      if (error.message === 'Cancelled' || isCancelledRef.current) {
        return
      }
      
      console.error('Upload error:', error)
      
      let errorMessage = 'Upload failed'
      
      if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection.'
      } else if (error.message.includes('log in')) {
        errorMessage = error.message
      } else {
        errorMessage = 'Upload failed: ' + (error.message || 'Unknown error. Please try again.')
      }
      
      toast.error(errorMessage, { duration: 6000 })
      resetUploadState()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-3xl p-6 sm:p-8 lg:p-12 text-center transition-all
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 bg-card hover:border-blue-400'
          }
        `}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.epub"
          onChange={handleFileSelect}
          disabled={uploading}
        />

        {!selectedFile ? (
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary flex items-center justify-center">
                <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                  Drop your book here
                </h3>
                <p className="text-muted-foreground mb-2">
                  or click to browse
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Supports PDF and EPUB (max 50MB)
                </p>
              </div>
            </div>
          </label>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <File className="w-10 h-10 text-primary" />
              <div className="text-left">
                <p className="font-semibold text-foreground">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              {!uploading && (
                <button
                  onClick={() => setSelectedFile(null)}
                  className="ml-auto p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </div>

            {!uploading ? (
              <button
                onClick={handleUpload}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg"
              >
                Upload Book
              </button>
            ) : (
              <div className="space-y-3">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-primary"
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{currentOperation}</span>
                  <span className="font-semibold text-primary">{uploadProgress}%</span>
                </div>
                <button
                  onClick={handleCancel}
                  className="w-full py-2 border-2 border-red-500 text-red-500 rounded-xl font-semibold hover:bg-red-50 transition-colors"
                >
                  Cancel Upload
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* AI Processing Status */}
      {aiProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-1">AI Analysis in Progress</h4>
              <p className="text-sm text-blue-700">{aiProgress}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
