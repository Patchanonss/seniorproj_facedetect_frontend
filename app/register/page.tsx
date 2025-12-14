"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/utils/api.config";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [studentCode, setStudentCode] = useState("");
    const [classId, setClassId] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState("IDLE"); // IDLE, UPLOADING, SUCCESS, ERROR
    const [message, setMessage] = useState("");
    
    // Camera State
    const [useCamera, setUseCamera] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    // Load class_id from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const cid = params.get("class_id");
        if (cid) setClassId(cid);
    }, []);
    
    // Camera Logic
    const [canUseCamera, setCanUseCamera] = useState(false);
    
    // Check camera availability on mount
    useEffect(() => {
        // Fix: Use optional chaining to strictly check runtime availability
        // Browsers on HTTP (non-localhost) will leave mediaDevices undefined or strip getUserMedia
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            setCanUseCamera(true);
        } else {
            console.log("Camera API unavailable (likely insecure HTTP)");
        }
    }, []);

    const startCamera = async () => {
        if (!canUseCamera) return;

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            setUseCamera(true);
            // Wait for render
            setTimeout(() => {
                if (videoRef.current) videoRef.current.srcObject = mediaStream;
            }, 100);
        } catch (e) {
            console.error(e);
            alert("Could not access camera. Please ensure you have granted permission.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setUseCamera(false);
    };

    const takePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const context = canvasRef.current.getContext("2d");
        if (!context) return;

        context.drawImage(videoRef.current, 0, 0, 640, 480);
        canvasRef.current.toBlob((blob) => {
            if (blob) {
                const capturedFile = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
                setFile(capturedFile);
                stopCamera();
            }
        }, "image/jpeg");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        
        setStatus("UPLOADING");
        
        try {
            // 1. Validate Phase
            const formData = new FormData();
            formData.append("file", file);
            
            const res = await fetch(`${getApiUrl()}/register/validate`, {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.detail || "Validation failed");
            
            // 2. Confirm Phase
            const confirmRes = await fetch(`${getApiUrl()}/register/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: data.token,
                    name: name,
                    student_code: studentCode,
                    class_id: parseInt(classId)
                })
            });
            const confirmData = await confirmRes.json();
             if (!confirmRes.ok) throw new Error(confirmData.detail || "Confirm failed");
             
             setStatus("SUCCESS");
             setMessage("Registration Successful!");
             
        } catch (err: any) {
            setStatus("ERROR");
            setMessage(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-gray-800">
            <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Student Registration</h1>
                
                {status === "SUCCESS" ? (
                    <div className="text-center">
                        <div className="text-5xl mb-4">✅</div>
                        <p className="text-green-600 font-bold mb-4">{message}</p>
                        <button onClick={() => window.location.reload()} className="text-blue-500 underline">Register Another</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {status === "ERROR" && (
                            <div className="bg-red-100 text-red-600 p-3 rounded text-sm">{message}</div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-bold mb-1">Full Name (English)</label>
                            <input 
                                type="text" 
                                className="w-full p-3 border rounded" 
                                value={name} onChange={e => setName(e.target.value)}
                                placeholder="e.g. Chanon S"
                                required
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-bold mb-1">Student ID</label>
                            <input 
                                type="text" 
                                className="w-full p-3 border rounded" 
                                value={studentCode} onChange={e => setStudentCode(e.target.value)}
                                placeholder="e.g. 64010123"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Class ID (Ask Professor)</label>
                            <input 
                                type="number" 
                                className="w-full p-3 border rounded" 
                                value={classId} onChange={e => setClassId(e.target.value)}
                                placeholder="e.g. 1"
                                required
                            />
                        </div>
                        
                        {/* PHOTO SECTION */}
                        <div>
                            <label className="block text-sm font-bold mb-1">Face Photo</label>
                            
                            {!useCamera ? (
                                <div className="space-y-2">
                                     <input 
                                        type="file" 
                                        className="w-full p-3 border rounded bg-gray-50" 
                                        accept="image/*"
                                        onChange={e => setFile(e.target.files?.[0] || null)}
                                        // required={!useCamera} // Logic handled manually
                                    />
                                    <div className="text-center text-sm text-gray-500">- OR -</div>
                                    
                                    {canUseCamera ? (
                                        <button 
                                            type="button"
                                            onClick={startCamera}
                                            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 rounded"
                                        >
                                            📷 Take Photo with Camera
                                        </button>
                                    ) : (
                                        <div className="bg-yellow-100 text-yellow-800 p-2 rounded text-xs text-center border border-yellow-200">
                                            <b>Camera Unavailable</b><br/>
                                            Browsers block camera on insecure (HTTP) connections.<br/>
                                            Please use the "Choose File" button above to upload a photo.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="relative bg-black rounded overflow-hidden aspect-video">
                                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                        <canvas ref={canvasRef} width="640" height="480" className="hidden" />
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            type="button"
                                            onClick={takePhoto}
                                            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded"
                                        >
                                            Capture
                                        </button>
                                         <button 
                                            type="button"
                                            onClick={stopCamera}
                                            className="bg-red-500 text-white px-4 py-2 rounded"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {file && !useCamera && (
                                <div className="mt-2 text-sm text-green-600 font-bold">
                                    Selected: {file.name}
                                </div>
                            )}
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={status === "UPLOADING" || (!file && !useCamera)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition disabled:bg-gray-400"
                        >
                            {status === "UPLOADING" ? "Processing..." : "Register"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
