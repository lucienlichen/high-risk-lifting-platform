<template>
  <div class="login-page">
    <!-- decorative background layers -->
    <div class="login-bg-glow"></div>
    <div class="login-bg-grid"></div>

    <div class="login-content">
      <!-- Brand above the panel -->
      <div class="login-brand">
        <img src="/logo.png" alt="平台 Logo" class="login-logo" />
        <h1 class="login-title">高风险起重装备智能运维与事故防控云服务平台</h1>
        <p class="login-subtitle">智能运维 · 事故防控 · 全域感知</p>
      </div>

      <div class="login-card">
      <div class="demo-accounts">
        <button type="button" class="demo-account-btn" @click="fillDemo('group_admin')">
          超级管理员 <span>group_admin</span>
        </button>
        <button type="button" class="demo-account-btn" @click="fillDemo('company_admin')">
          集团管理员 <span>company_admin</span>
        </button>
        <button type="button" class="demo-account-btn" @click="fillDemo('factory_admin')">
          分厂管理员 <span>factory_admin</span>
        </button>
      </div>
      <!-- Form -->
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="scene">
          <div class="login-scene-select">
            <span class="login-scene-label">所属场景</span>
            <el-select v-if="canSwitchScene" v-model="form.scene" size="large" style="width: 100%">
              <el-option
                v-for="scene in SCENES"
                :key="scene.id"
                :label="scene.name"
                :value="scene.id"
              />
            </el-select>
            <div v-else class="login-scene-static">{{ fixedSceneName }}</div>
          </div>
        </el-form-item>
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            size="large"
            placeholder="请输入账号"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            size="large"
            type="password"
            show-password
            placeholder="请输入密码"
            :prefix-icon="Lock"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-submit"
            :loading="loading"
            @click="handleLogin"
          >登 录</el-button>
        </el-form-item>
      </el-form>

      <p class="login-footer">© 2026 高风险起重装备智能运维与事故防控云服务平台</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useSceneStore } from '@/stores/scene'
import { SCENES } from '@/mock'
import type { SceneId } from '@/mock'

const router = useRouter()
const auth   = useAuthStore()
const sceneStore = useSceneStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  scene: 'metallurgy' as SceneId
})
const loginRole = computed(() => auth.resolveRole(form.username))
const canSwitchScene = computed(() => loginRole.value === 'superAdmin')
const fixedSceneName = computed(() => SCENES.find(scene => scene.id === 'metallurgy')?.name ?? '冶金起重装备')

const rules: FormRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  scene: [{ required: true, message: '请选择应用场景', trigger: 'change' }]
}

function fillDemo(username: string) {
  form.username = username
  form.password = '123456'
}

function handleLogin() {
  formRef.value?.validate((valid) => {
    if (!valid) return
    loading.value = true
    // 纯前端原型：任意非空账号即可登录
    window.setTimeout(() => {
      auth.login(form.username)
      sceneStore.setScene(canSwitchScene.value ? form.scene : 'metallurgy')
      router.push('/services')
    }, 500)
  })
}
</script>

<style scoped>
.login-page {
  position: relative;
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(135deg, var(--color-header-bg) 0%, var(--color-header-bg2) 100%);
}

/* soft blue glow */
.login-bg-glow {
  position: absolute;
  top: -20%;
  right: -10%;
  width: 60vw;
  height: 60vw;
  background: radial-gradient(circle, rgba(22,119,255,0.28) 0%, rgba(22,119,255,0) 65%);
  pointer-events: none;
}

/* subtle dotted grid */
.login-bg-grid {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
  background-size: 26px 26px;
  pointer-events: none;
}

/* Brand + card stacked, centered */
.login-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  max-width: calc(100vw - 32px);
}

.login-card {
  width: 100%;
  max-width: 100%;
  padding: 56px 48px 44px;
  background: rgba(13, 33, 64, 0.42);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  box-shadow: 0 12px 40px rgba(3, 12, 28, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

/* Brand above the panel, on the dark gradient */
.login-brand {
  text-align: center;
}

.login-logo {
  width: 180px;
  height: auto;
  display: block;
  margin: 0 auto 6px;
  filter: drop-shadow(0 8px 22px rgba(0, 0, 0, 0.45));
}

.login-title {
  font-size: 30px;
  font-weight: 800;
  line-height: 1.35;
  color: #ffffff;
  letter-spacing: 1px;
  white-space: nowrap;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
}

.login-subtitle {
  margin-top: 14px;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.66);
  letter-spacing: 3px;
}

.login-form {
  margin-top: 4px;
}

.demo-accounts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.demo-account-btn {
  padding: 10px 12px;
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: var(--radius-sm);
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.9);
  cursor: pointer;
  text-align: left;
  font-weight: 700;
}

.demo-account-btn span {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255,255,255,0.58);
}

.login-scene-select {
  width: 100%;
}

.login-scene-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.72);
}

.login-scene-static {
  min-height: 40px;
  display: flex;
  align-items: center;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.92);
  font-size: 15px;
  font-weight: 700;
}

.login-submit {
  width: 100%;
  font-size: 15px;
  letter-spacing: 4px;
}

.login-footer {
  margin-top: 8px;
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}
</style>
