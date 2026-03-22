import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/appContext'
import { Button } from '../components/Button'
import { Input } from '../components/Input'

export default function SignUpPage() {
  const { signup } = useApp()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setSubmitting(true)
    try {
      const success = await signup(username, email, password)
      if (success) {
        navigate('/')
      } else {
        setError('Registration failed. Email may already be in use.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-svh overflow-hidden bg-linear-to-br from-background via-background to-muted/20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_40rem_at_20%_10%,hsl(var(--primary)/0.12),transparent_60%),radial-gradient(50rem_35rem_at_80%_30%,hsl(var(--primary)/0.08),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative mx-auto flex min-h-svh w-full max-w-6xl items-center px-6 py-10 md:px-10">
        <div className="grid w-full items-center gap-12 md:grid-cols-2">
          <div className="hidden md:flex md:flex-col md:gap-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">ParquetPro</h1>
            <div className="group rounded-2xl border border-border/50 bg-background/80 p-8 shadow-xl shadow-black/5 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 supports-[backdrop-filter]:bg-background/70">
              <div className="space-y-6">
                <section className="space-y-3">
                  <h2 className="text-base font-bold tracking-tight text-foreground">
                    ШАЛНЫ БОЛОН АГУУЛАХЫН УДИРДЛАГА
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Паркетын материал, нөөцийн үлдэгдэл, шалны төлөвлөлтийг нэг дороос удирдаарай.
                  </p>
                </section>
              </div>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-col gap-8">
            <div className="flex flex-col items-center gap-4 md:hidden">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">ParquetPro</h1>
              <p className="text-sm text-muted-foreground">Шалны хувлагч ба агуулахын удирдлага</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                <div className="group border-border/50 shadow-2xl shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:shadow-primary/5 supports-[backdrop-filter]:bg-background/90 rounded-xl border bg-card/90">
                  <div className="space-y-3 text-center pb-6 pt-8 px-6">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Бүртгэл үүсгэх</h2>
                    <p className="text-base text-muted-foreground">Эхлээд мэдээллээ оруулж бүртгүүлнэ үү</p>
                  </div>
                  <div className="px-6 pb-8">
                    <div className="space-y-5">
                      <Input
                        label="Нэр"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Өөрийн нэрээ оруулна уу"
                        required
                        className="h-11"
                      />
                      <Input
                        label="И-мэйл"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="И-мэйл хаягаа оруулна уу"
                        required
                        className="h-11"
                      />
                      <Input
                        label="Нууц үг"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="h-11"
                      />
                      <Input
                        label="Нууц үгээ давтан оруулах"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
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
                        {submitting ? '...' : 'Бүртгэл үүсгэх'}
                      </Button>
                    </div>
                    <p className="mt-6 text-sm text-muted-foreground text-center">
                      Аль хэдийн бүртгэлтэй юу?{' '}
                      <Link to="/login" className="text-primary font-medium hover:underline underline-offset-4">
                        Нэвтрэх
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
