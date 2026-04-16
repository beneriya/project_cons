import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/appContext'
import { Button } from '../components/Button'
import { Input } from '../components/Input'

export default function LoginPage() {
  const { login } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const success = await login(email, password)
      if (success) {
        navigate('/')
      } else {
        setError('Invalid credentials. Try admin@parquet.com / admin123')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-svh overflow-hidden bg-linear-to-br from-background via-background to-muted/20">
      {/* Enhanced gradient background - matches backoffice */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_40rem_at_20%_10%,hsl(var(--primary)/0.12),transparent_60%),radial-gradient(50rem_35rem_at_80%_30%,hsl(var(--primary)/0.08),transparent_55%)]" />
      {/* Subtle grid pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative mx-auto flex min-h-svh w-full max-w-6xl items-center px-6 py-10 md:px-10">
        <div className="grid w-full items-center gap-12 md:grid-cols-2">
          {/* Left side - Brand/info panel (hidden on mobile) */}
          <div className="hidden md:flex md:flex-col md:gap-8">
            <div className="flex items-center gap-3 transition-transform">
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                ParquetPro
              </h1>
            </div>
            <div className="group rounded-2xl border border-border/50 bg-background/80 p-8 shadow-xl shadow-black/5 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 supports-[backdrop-filter]:bg-background/70">
              <div className="space-y-6">
                <section className="space-y-3">
                  <h2 className="text-base font-bold tracking-tight text-foreground">
                    Паркет-н шалны хувьлагч ба агуулахын удирдлага
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Паркетын материал, нөөцийн үлдэгдэл, шилжүүлэг болон шалны төлөвлөлтийг нэг дороос удирдаарай.
                  </p>
                </section>
                <div className="h-px bg-linear-to-r from-transparent via-border to-transparent" />
                <section className="space-y-3">
                  <h2 className="text-base font-bold tracking-tight text-foreground">
                    ГОЛ БОЛОМЖУУД
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Бодит цагийн нөөцийн сэрэмжлүүлэг, шилжүүлгийн бүртгэл, шалны төлөвлөгч, файл болгон export хийх боломжтой.
                  </p>
                </section>
              </div>
            </div>
          </div>

          {/* Right side - Login form */}
          <div className="mx-auto flex w-full max-w-md flex-col gap-8">
            <div className="flex flex-col items-center gap-4 md:hidden">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                ParquetPro
              </h1>
              <p className="text-sm text-muted-foreground">
                Паркет-н шалны хувьлагч ба агуулахын удирдлага
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                <div className="group rounded-xl border border-border/50 bg-card/90 shadow-2xl shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:shadow-primary/5 supports-[backdrop-filter]:bg-background/90">
                  <div className="space-y-3 text-center px-6 pt-8 pb-6">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      Тавтай морил
                    </h2>
                    <p className="text-base text-muted-foreground">
                      Өөрийн бүртгэлээр нэвтэрнэ үү
                    </p>
                  </div>
                  <div className="px-6 pb-8">
                    <div className="space-y-5">
                      <Input
                        label="И-мэйл"
                        type="email"
                        placeholder="admin@parquet.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={!!error}
                        required
                        className="h-11"
                      />
                      <Input
                        label="Нууц үг"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        hint={error}
                        error={!!error}
                        required
                        className="h-11"
                      />
                      <Button
                        type="submit"
                        className="w-full h-11 text-base font-semibold shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                        disabled={submitting}
                      >
                        {submitting ? 'Нэвтэрч байна…' : 'Нэвтрэх'}
                      </Button>
                    </div>
                    <div className="mt-6 rounded-xl bg-muted/60 p-4 sm:p-5">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                        Демо бүртгэлүүд
                      </div>
                      <div className="text-xs text-muted-foreground leading-relaxed space-y-1.5">
                        <p>Админ: admin@parquet.com / admin123</p>
                        <p>Ажилтан: worker@parquet.com / worker123</p>
                        <p>Худалдан авагч: buyer@parquet.com / buyer123</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            <p className="mt-6 text-sm text-muted-foreground text-center">
              Бүртгэлгүй байна уу?{' '}
              <Link to="/signup" className="text-primary font-medium hover:underline underline-offset-4">
                Шинээр бүртгүүлэх
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
