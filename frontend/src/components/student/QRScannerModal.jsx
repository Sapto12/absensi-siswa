
import { useEffect, useRef, useState } from "react";
import {
    Camera,
    CheckCircle2,
    LoaderCircle,
    X,
    XCircle,
} from "lucide-react";
import { Button } from "@heroui/react";
import { Html5Qrcode } from "html5-qrcode";

import api from "../../services/api";

function QRScannerModal({
    isOpen,
    onClose,
    onSuccess,
    onConflict,
    mode = "checkin",
}) {
    const scannerRef = useRef(null);
    const processingRef = useRef(false);

    const [scannerState, setScannerState] = useState("starting");
    const [message, setMessage] = useState("");

    const isCheckout = mode === "checkout";
    const actionLabel = isCheckout ? "Absen Pulang" : "Absen Masuk";
    const endpoint = isCheckout
        ? "/attendance/checkout"
        : "/attendance/scan";

    const stopScanner = async () => {
        const scanner = scannerRef.current;

        if (!scanner) return;

        try {
            if (scanner.isScanning) {
                await scanner.stop();
            }
        } catch (error) {
            console.error("Gagal menghentikan kamera:", error);
        }

        try {
            scanner.clear();
        } catch (error) {
            console.error("Gagal membersihkan scanner:", error);
        }

        if (scannerRef.current === scanner) {
            scannerRef.current = null;
        }
    };

    const handleScan = async (decodedText) => {
        if (processingRef.current) return;

        processingRef.current = true;
        setScannerState("processing");
        setMessage(`Memproses ${actionLabel.toLowerCase()}...`);

        try {
            let qrData;

            try {
                qrData = JSON.parse(decodedText);
            } catch {
                throw new Error("QR Code tidak valid.");
            }

            if (
                qrData?.type !== "ATTENDANCE" ||
                !qrData?.studentId ||
                !qrData?.token
            ) {
                throw new Error("QR Code bukan QR absensi yang valid.");
            }

            let response;

            try {
                response = await api.post(endpoint, {
                    studentId: Number(qrData.studentId),
                    token: qrData.token,
                });
            } catch (error) {
                const statusCode = error.response?.status;
                const backendMessage =
                    error.response?.data?.message ||
                    "Permintaan absensi gagal.";

                if (statusCode === 409) {
                    await stopScanner();

                    if (onConflict) {
                        try {
                            await onConflict();
                        } catch (refreshError) {
                            console.error(
                                "Gagal memperbarui dashboard:",
                                refreshError
                            );
                        }
                    }

                    setScannerState("conflict");
                    setMessage(backendMessage);
                    return;
                }

                throw new Error(backendMessage);
            }

            await stopScanner();

            setScannerState("success");
            setMessage(
                response.data?.message ||
                    `${actionLabel} berhasil dicatat.`
            );

            // Kegagalan refresh UI tidak boleh membatalkan hasil absensi.
            if (onSuccess) {
                try {
                    await onSuccess(response.data?.data);
                } catch (refreshError) {
                    console.error(
                        "Absensi berhasil, tetapi dashboard gagal diperbarui:",
                        refreshError
                    );
                }
            }
        } catch (error) {
            console.error(
                "Absensi gagal:",
                error.response?.data || error.message
            );

            setScannerState("scanning");
            setMessage(error.message || "Absensi gagal dilakukan.");
        } finally {
            processingRef.current = false;
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        let cancelled = false;

        processingRef.current = false;
        setScannerState("starting");
        setMessage("");

        const startScanner = async () => {
            const scanner = new Html5Qrcode("student-qr-reader");
            scannerRef.current = scanner;

            try {
                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1,
                    },
                    async (decodedText) => {
                        if (!cancelled) {
                            await handleScan(decodedText);
                        }
                    },
                    () => {
                        // Frame tanpa QR diabaikan.
                    }
                );

                if (cancelled) {
                    await stopScanner();
                } else {
                    setScannerState("scanning");
                }
            } catch (error) {
                console.error("Kamera gagal dibuka:", error);

                if (!cancelled) {
                    await stopScanner();
                    setScannerState("error");

                    if (
                        error?.name === "NotAllowedError" ||
                        error?.message?.toLowerCase().includes("permission")
                    ) {
                        setMessage(
                            "Akses kamera ditolak. Izinkan akses kamera pada browser."
                        );
                    } else {
                        setMessage(
                            "Kamera tidak dapat digunakan. Periksa izin kamera dan koneksi HTTPS atau localhost."
                        );
                    }
                }
            }
        };

        const timer = setTimeout(startScanner, 100);

        return () => {
            cancelled = true;
            clearTimeout(timer);
            void stopScanner();
        };
    }, [isOpen, mode]);

    const handleClose = async () => {
        await stopScanner();
        processingRef.current = false;
        onClose();
    };

    if (!isOpen) return null;

    const isSuccessful = scannerState === "success";
    const isConflict = scannerState === "conflict";
    const isError = scannerState === "error";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div>
                        <h2 className="font-semibold text-slate-900">
                            Scan QR {actionLabel}
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Arahkan kamera ke QR Code milikmu
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Tutup scanner"
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5">
                    {isSuccessful || isConflict || isError ? (
                        <div className="py-10 text-center">
                            <div
                                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
                                    isSuccessful
                                        ? "bg-emerald-50 text-emerald-600"
                                        : "bg-amber-50 text-amber-600"
                                }`}
                            >
                                {isSuccessful ? (
                                    <CheckCircle2 size={34} />
                                ) : (
                                    <XCircle size={34} />
                                )}
                            </div>

                            <h3 className="mt-5 text-xl font-bold text-slate-900">
                                {isSuccessful
                                    ? `${actionLabel} Berhasil`
                                    : isConflict
                                      ? "Absensi Tidak Diproses"
                                      : "Kamera Tidak Dapat Digunakan"}
                            </h3>

                            <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">
                                {message}
                            </p>

                            <Button
                                className="mt-6"
                                color="primary"
                                onPress={handleClose}
                            >
                                Selesai
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="relative overflow-hidden rounded-xl bg-slate-950">
                                <div
                                    id="student-qr-reader"
                                    className="min-h-[320px] w-full"
                                />

                                {scannerState === "scanning" && (
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                        <div className="relative h-64 w-64">
                                            <div className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-white" />
                                            <div className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-white" />
                                            <div className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-white" />
                                            <div className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-white" />
                                            <div className="absolute left-2 right-2 top-1/2 h-0.5 animate-pulse bg-blue-500" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-5 text-center">
                                {scannerState === "starting" && (
                                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                                        <LoaderCircle
                                            size={18}
                                            className="animate-spin"
                                        />
                                        Membuka kamera...
                                    </div>
                                )}

                                {scannerState === "scanning" && (
                                    <>
                                        <div className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600">
                                            <Camera size={17} />
                                            Kamera aktif
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Pindai QR untuk {actionLabel.toLowerCase()}
                                        </p>
                                    </>
                                )}

                                {scannerState === "processing" && (
                                    <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                                        <LoaderCircle
                                            size={18}
                                            className="animate-spin"
                                        />
                                        {message}
                                    </div>
                                )}

                                {scannerState === "scanning" && message && (
                                    <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                        {message}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default QRScannerModal;
