<template>
  <StatusOverlay :model-value="isTransitioning" :message="transitionMessage" />

  <div id="mujoco-container" class="mujoco-container" />

  <ControlPanel :project-name="projectName" :project-link="projectLink" :route-items="routeItems"
    :current-route-name="$route.name" :is-mobile="isMobile" :task-items="taskItems" :task-id="task"
    :policy-items="policyItems" :policy-id="policy" :selected-task="selectedTask" :selected-policy="selectedPolicy"
    :collapsed="isPanelCollapsed"
    :use-setpoint="use_setpoint" :command-vel-x="command_vel_x" :compliant-mode="compliant_mode" :facet-kp="facet_kp"
    :trajectory-state="trajectoryPlaybackState" :trajectory-loop="trajectoryLoop" @navigateRoute="goToRoute"
    @toggle="togglePanel"
    @selectTask="onSelectTask" @selectPolicy="onSelectPolicy" @update:useSetpoint="onUpdateUseSetpoint"
    @update:commandVelX="onUpdateCommandVelX" @update:facetKp="onUpdateFacetKp"
    @update:compliantMode="onUpdateCompliantMode" @playTrajectory="playTrajectory" @stopTrajectory="stopTrajectory"
    @resetTrajectory="resetTrajectory" @update:trajectoryLoop="updateTrajectoryLoop" @impulse="triggerImpulse"
    @reset="reset" />

  <StatusDialogs :state="state" :extra-error-message="extra_error_message"
    :url-param-error-message="urlParamErrorMessage" :is-mobile="isMobile" :is-small-screen="isSmallScreen"
    @clearWarning="clearUrlWarning" />

  <Notice />

  <HelpDialog v-model="showHelpDialog" :is-mobile="isMobile" :show-button="!isMobile || isPanelCollapsed" @toggleHelp="() => (showHelpDialog = !showHelpDialog)"
    @toggleUI="toggleUIVisibility" @reset="reset" @navigateScene="navigateScene" @navigatePolicy="navigatePolicy" />
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ControlPanel from '@/views/demo/components/ControlPanel.vue'
import StatusDialogs from '@/views/demo/components/StatusDialogs.vue'
import HelpDialog from '@/views/demo/components/HelpDialog.vue'
import Notice from '@/views/demo/components/Notice.vue'
import { useConfig } from '@/views/demo/composables/useConfig'
import { useRuntime } from '@/views/demo/composables/useRuntime'
import { useScenePolicy } from '@/views/demo/composables/useScenePolicy'
import { useUrlSync } from '@/views/demo/composables/useUrlSync'
import { useTransition } from '@/views/demo/composables/useTransition'
import { useResponsive } from '@/views/demo/composables/useResponsive'
import { createShortcuts } from '@/utils/shortcuts.js'
import StatusOverlay from '@/views/demo/components/StatusOverlay.vue'

const props = defineProps({ configPath: { type: String, default: './config.json' } })

const transitionApi = useTransition()
const isTransitioning = transitionApi.isTransitioning
const transitionMessage = transitionApi.transitionMessage
const withTransition = transitionApi.withTransition
const { isMobile, isSmallScreen, isPanelCollapsed, togglePanel } = useResponsive()
const rt = useRuntime()
const {
  state,
  extra_error_message,
  use_setpoint,
  command_vel_x,
  compliant_mode,
  facet_kp,
  trajectoryPlaybackState,
  trajectoryLoop,
  initRuntime,
  onTaskChange,
  onPolicyChange,
  updateFacetKp,
  updateUseSetpoint,
  updateCommandVelX,
  updateCompliantMode,
  triggerImpulse,
  playTrajectory,
  stopTrajectory,
  resetTrajectory,
  updateTrajectoryLoop,
  reset,
  dispose,
} = rt

const conf = useConfig(props.configPath)
const { config: appConfig, task, policy, taskItems, policyItems, selectedTask, selectedPolicy, urlParamErrorMessage, resolveDefaultPolicy, loadConfig } = conf
const projectName = computed(() => appConfig.value?.project_name)
const projectLink = computed(() => appConfig.value?.project_link)

const { routeItems, goToRoute, sync } = useUrlSync({
  router: useRouter(),
  route: useRoute(),
  getSceneName: () => selectedTask.value?.name || null,
  getPolicyName: () => selectedPolicy.value?.name || null,
})

const { selectTask, selectPolicy, navigateScene, navigatePolicy } = useScenePolicy({
  config: appConfig,
  task,
  policy,
  resolveDefaultPolicy,
  onTaskChange,
  onPolicyChange,
  withTransition,
})

const showHelpDialog = ref(false)
let shortcuts = null

function toggleUIVisibility() {
  document.body.classList.toggle('interactive-mode')
}

async function onSelectTask(id) { await selectTask(id) }
async function onSelectPolicy(id) { await selectPolicy(id) }

function onUpdateUseSetpoint(v) {
  use_setpoint.value = v
  updateUseSetpoint()
}

function onUpdateCommandVelX(v) {
  command_vel_x.value = v
  updateCommandVelX()
}

function onUpdateFacetKp(v) {
  facet_kp.value = v
  updateFacetKp()
}

function onUpdateCompliantMode(v) {
  compliant_mode.value = v
  updateCompliantMode()
}

function clearUrlWarning() { urlParamErrorMessage.value = '' }

watch([selectedTask, selectedPolicy], () => sync())

onMounted(async () => {
  await loadConfig()
  if (selectedTask.value) {
    const initialTask = selectedTask.value
    const initialPolicy = selectedPolicy.value
    await initRuntime(initialTask, initialPolicy)
  }

  const urlParams = new URLSearchParams(window.location.hash.split('?')[1])
  if (urlParams.get('hidectrl') === '1') {
    document.body.classList.add('interactive-mode')
  } else if (urlParams.get('hidectrl') === '0') {
    document.body.classList.remove('interactive-mode')
  }

  shortcuts = createShortcuts({
    onReset: () => reset(),
    onToggleUI: () => toggleUIVisibility(),
    onNavigateScene: (d) => navigateScene(d),
    onNavigatePolicy: (d) => navigatePolicy(d),
    getHelpVisible: () => showHelpDialog.value,
    setHelpVisible: (v) => { showHelpDialog.value = v },
  })
})

onBeforeUnmount(() => {
  dispose()
  if (shortcuts && typeof shortcuts.detach === 'function') shortcuts.detach()
  document.body.classList.remove('interactive-mode')
})
</script>

<style scoped>
.mujoco-container {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100vh;
  z-index: 1;
}
</style>
