import { expect, should as chaiShould, use as chaiUse } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as path from 'path';
import { SemVer } from 'semver';
import { instance, mock } from 'ts-mockito';
import * as TypeMoq from 'typemoq';
import { ConfigurationTarget, Uri } from 'vscode';
import { IExtensionSingleActivationService } from '../../client/activation/types';
import { ActiveResourceService } from '../../client/common/application/activeResource';
import { ApplicationEnvironment } from '../../client/common/application/applicationEnvironment';
import { ApplicationShell } from '../../client/common/application/applicationShell';
import { ClipboardService } from '../../client/common/application/clipboard';
import { CommandManager } from '../../client/common/application/commandManager';
import { ReloadVSCodeCommandHandler } from '../../client/common/application/commands/reloadCommand';
import { ReportIssueCommandHandler } from '../../client/common/application/commands/reportIssueCommand';
import { DebugService } from '../../client/common/application/debugService';
import { DebugSessionTelemetry } from '../../client/common/application/debugSessionTelemetry';
import { DocumentManager } from '../../client/common/application/documentManager';
import { Extensions } from '../../client/common/application/extensions';
import {
    IActiveResourceService,
    IApplicationEnvironment,
    IApplicationShell,
    IClipboard,
    ICommandManager,
    IDebugService,
    IDocumentManager,
    IJupyterExtensionDependencyManager,
    IWorkspaceService,
} from '../../client/common/application/types';
import { WorkspaceService } from '../../client/common/application/workspace';
import { AsyncDisposableRegistry } from '../../client/common/asyncDisposableRegistry';
import { ConfigurationService } from '../../client/common/configuration/service';
import { EditorUtils } from '../../client/common/editor';
import { DiscoveryVariants } from '../../client/common/experiments/groups';
import { ExperimentService } from '../../client/common/experiments/service';
import {
    ExtensionInsidersDailyChannelRule,
    ExtensionInsidersOffChannelRule,
    ExtensionInsidersWeeklyChannelRule,
} from '../../client/common/insidersBuild/downloadChannelRules';
import { ExtensionChannelService } from '../../client/common/insidersBuild/downloadChannelService';
import { InsidersExtensionPrompt } from '../../client/common/insidersBuild/insidersExtensionPrompt';
import { InsidersExtensionService } from '../../client/common/insidersBuild/insidersExtensionService';
import {
    ExtensionChannel,
    IExtensionChannelRule,
    IExtensionChannelService,
    IInsiderExtensionPrompt,
} from '../../client/common/insidersBuild/types';
import { CondaInstaller } from '../../client/common/installer/condaInstaller';
import { PipEnvInstaller } from '../../client/common/installer/pipEnvInstaller';
import { PipInstaller } from '../../client/common/installer/pipInstaller';
import { ProductInstaller } from '../../client/common/installer/productInstaller';
import { IModuleInstaller } from '../../client/common/installer/types';
import { InterpreterPathService } from '../../client/common/interpreterPathService';
import { BrowserService } from '../../client/common/net/browser';
import { FileDownloader } from '../../client/common/net/fileDownloader';
import { HttpClient } from '../../client/common/net/httpClient';
import { NugetService } from '../../client/common/nuget/nugetService';
import { INugetService } from '../../client/common/nuget/types';
import { PersistentStateFactory } from '../../client/common/persistentState';
import { FileSystem } from '../../client/common/platform/fileSystem';
import { PathUtils } from '../../client/common/platform/pathUtils';
import { PlatformService } from '../../client/common/platform/platformService';
import { IFileSystem, IPlatformService } from '../../client/common/platform/types';
import { CurrentProcess } from '../../client/common/process/currentProcess';
import { ProcessLogger } from '../../client/common/process/logger';
import { IProcessLogger, IProcessServiceFactory, IPythonExecutionFactory } from '../../client/common/process/types';
import { TerminalActivator } from '../../client/common/terminal/activator';
import { PowershellTerminalActivationFailedHandler } from '../../client/common/terminal/activator/powershellFailedHandler';
import { Bash } from '../../client/common/terminal/environmentActivationProviders/bash';
import { CommandPromptAndPowerShell } from '../../client/common/terminal/environmentActivationProviders/commandPrompt';
import { CondaActivationCommandProvider } from '../../client/common/terminal/environmentActivationProviders/condaActivationProvider';
import { PipEnvActivationCommandProvider } from '../../client/common/terminal/environmentActivationProviders/pipEnvActivationProvider';
import { PyEnvActivationCommandProvider } from '../../client/common/terminal/environmentActivationProviders/pyenvActivationProvider';
import { TerminalHelper } from '../../client/common/terminal/helper';
import { SettingsShellDetector } from '../../client/common/terminal/shellDetectors/settingsShellDetector';
import { TerminalNameShellDetector } from '../../client/common/terminal/shellDetectors/terminalNameShellDetector';
import { UserEnvironmentShellDetector } from '../../client/common/terminal/shellDetectors/userEnvironmentShellDetector';
import { VSCEnvironmentShellDetector } from '../../client/common/terminal/shellDetectors/vscEnvironmentShellDetector';
import {
    IShellDetector,
    ITerminalActivationCommandProvider,
    ITerminalActivationHandler,
    ITerminalActivator,
    ITerminalHelper,
    ITerminalService,
    ITerminalServiceFactory,
    TerminalActivationProviders,
} from '../../client/common/terminal/types';
import {
    IAsyncDisposableRegistry,
    IBrowserService,
    IConfigurationService,
    ICurrentProcess,
    IEditorUtils,
    IExperimentService,
    IExtensions,
    IFileDownloader,
    IHttpClient,
    IInstaller,
    IInterpreterPathProxyService,
    IInterpreterPathService,
    IPathUtils,
    IPersistentStateFactory,
    IPythonSettings,
    IRandom,
    IsWindows,
} from '../../client/common/types';
import { IMultiStepInputFactory, MultiStepInputFactory } from '../../client/common/utils/multiStepInput';
import { Architecture } from '../../client/common/utils/platform';
import { Random } from '../../client/common/utils/random';
import {
    ICondaService,
    ICondaLocatorService,
    IInterpreterLocatorService,
    IInterpreterService,
    INTERPRETER_LOCATOR_SERVICE,
    PIPENV_SERVICE,
    IComponentAdapter,
} from '../../client/interpreter/contracts';
import { IServiceContainer } from '../../client/ioc/types';
import { JupyterExtensionDependencyManager } from '../../client/jupyter/jupyterExtensionDependencyManager';
import { EnvironmentType, PythonEnvironment } from '../../client/pythonEnvironments/info';
import { ImportTracker } from '../../client/telemetry/importTracker';
import { IImportTracker } from '../../client/telemetry/types';
import { getExtensionSettings, PYTHON_PATH, rootWorkspaceUri } from '../common';
import { MockModuleInstaller } from '../mocks/moduleInstaller';
import { MockProcessService } from '../mocks/proc';
import { UnitTestIocContainer } from '../testing/serviceRegistry';
import { closeActiveWindows, initializeTest } from '../initialize';
import { InterpreterPathProxyService } from '../../client/common/interpreterPathProxyService';

chaiUse(chaiAsPromised);

const info: PythonEnvironment = {
    architecture: Architecture.Unknown,
    companyDisplayName: '',
    displayName: '',
    envName: '',
    path: '',
    envType: EnvironmentType.Unknown,
    version: new SemVer('0.0.0-alpha'),
    sysPrefix: '',
    sysVersion: '',
};

suite('Module Installer', () => {
    [undefined, Uri.file(__filename)].forEach((resource) => {
        let ioc: UnitTestIocContainer;
        let mockTerminalService: TypeMoq.IMock<ITerminalService>;
        let condaService: TypeMoq.IMock<ICondaService>;
        let condaLocatorService: TypeMoq.IMock<ICondaLocatorService>;
        let experimentService: TypeMoq.IMock<IExperimentService>;
        let interpreterService: TypeMoq.IMock<IInterpreterService>;
        let mockTerminalFactory: TypeMoq.IMock<ITerminalServiceFactory>;

        const workspaceUri = Uri.file(path.join(__dirname, '..', '..', '..', 'src', 'test'));
        suiteSetup(initializeTest);
        setup(async () => {
            chaiShould();
            await initializeDI();
            await initializeTest();
            await resetSettings();
        });
        suiteTeardown(async () => {
            await closeActiveWindows();
        });
        teardown(async () => {
            await ioc.dispose();
            await closeActiveWindows();
        });

        async function initializeDI() {
            ioc = new UnitTestIocContainer();
            ioc.registerUnitTestTypes();
            ioc.registerVariableTypes();
            ioc.registerLinterTypes();
            ioc.registerFormatterTypes();
            ioc.registerInterpreterStorageTypes();

            ioc.serviceManager.addSingleton<IPersistentStateFactory>(IPersistentStateFactory, PersistentStateFactory);
            ioc.serviceManager.addSingleton<IProcessLogger>(IProcessLogger, ProcessLogger);
            ioc.serviceManager.addSingleton<IInstaller>(IInstaller, ProductInstaller);

            mockTerminalService = TypeMoq.Mock.ofType<ITerminalService>();
            mockTerminalFactory = TypeMoq.Mock.ofType<ITerminalServiceFactory>();
            // If resource is provided, then ensure we do not invoke without the resource.
            mockTerminalFactory
                .setup((t) => t.getTerminalService(TypeMoq.It.isAny()))
                .callback((passedInResource) => expect(passedInResource).to.be.deep.equal({ resource }))
                .returns(() => mockTerminalService.object);
            ioc.serviceManager.addSingletonInstance<ITerminalServiceFactory>(
                ITerminalServiceFactory,
                mockTerminalFactory.object,
            );

            ioc.serviceManager.addSingleton<IModuleInstaller>(IModuleInstaller, PipInstaller);
            ioc.serviceManager.addSingleton<IModuleInstaller>(IModuleInstaller, CondaInstaller);
            ioc.serviceManager.addSingleton<IModuleInstaller>(IModuleInstaller, PipEnvInstaller);

            ioc.serviceManager.addSingleton<IPathUtils>(IPathUtils, PathUtils);
            ioc.serviceManager.addSingleton<ICurrentProcess>(ICurrentProcess, CurrentProcess);
            ioc.serviceManager.addSingleton<IFileSystem>(IFileSystem, FileSystem);
            ioc.serviceManager.addSingleton<IPlatformService>(IPlatformService, PlatformService);
            ioc.serviceManager.addSingleton<IConfigurationService>(IConfigurationService, ConfigurationService);

            ioc.serviceManager.addSingletonInstance<IWorkspaceService>(IWorkspaceService, new WorkspaceService());

            ioc.registerMockProcessTypes();
            ioc.serviceManager.addSingletonInstance<boolean>(IsWindows, false);

            await ioc.registerMockInterpreterTypes();
            condaService = TypeMoq.Mock.ofType<ICondaService>();
            condaLocatorService = TypeMoq.Mock.ofType<ICondaLocatorService>();
            experimentService = TypeMoq.Mock.ofType<IExperimentService>();
            experimentService
                .setup((e) => e.inExperiment(DiscoveryVariants.discoverWithFileWatching))
                .returns(() => Promise.resolve(false));
            ioc.serviceManager.addSingletonInstance<ICondaLocatorService>(
                ICondaLocatorService,
                condaLocatorService.object,
            );
            ioc.serviceManager.rebindInstance<ICondaService>(ICondaService, condaService.object);
            interpreterService = TypeMoq.Mock.ofType<IInterpreterService>();
            ioc.serviceManager.rebindInstance<IInterpreterService>(IInterpreterService, interpreterService.object);

            ioc.serviceManager.addSingleton<IActiveResourceService>(IActiveResourceService, ActiveResourceService);
            ioc.serviceManager.addSingleton<IInterpreterPathService>(IInterpreterPathService, InterpreterPathService);
            ioc.serviceManager.addSingleton<IInterpreterPathProxyService>(
                IInterpreterPathProxyService,
                InterpreterPathProxyService,
            );
            ioc.serviceManager.addSingleton<IExtensions>(IExtensions, Extensions);
            ioc.serviceManager.addSingleton<IRandom>(IRandom, Random);
            ioc.serviceManager.addSingleton<IApplicationShell>(IApplicationShell, ApplicationShell);
            ioc.serviceManager.addSingleton<IClipboard>(IClipboard, ClipboardService);
            ioc.serviceManager.addSingleton<ICommandManager>(ICommandManager, CommandManager);
            ioc.serviceManager.addSingleton<IDocumentManager>(IDocumentManager, DocumentManager);
            ioc.serviceManager.addSingleton<IDebugService>(IDebugService, DebugService);
            ioc.serviceManager.addSingleton<IApplicationEnvironment>(IApplicationEnvironment, ApplicationEnvironment);
            ioc.serviceManager.addSingleton<IJupyterExtensionDependencyManager>(
                IJupyterExtensionDependencyManager,
                JupyterExtensionDependencyManager,
            );
            ioc.serviceManager.addSingleton<IBrowserService>(IBrowserService, BrowserService);
            ioc.serviceManager.addSingleton<IHttpClient>(IHttpClient, HttpClient);
            ioc.serviceManager.addSingleton<IFileDownloader>(IFileDownloader, FileDownloader);
            ioc.serviceManager.addSingleton<IEditorUtils>(IEditorUtils, EditorUtils);
            ioc.serviceManager.addSingleton<INugetService>(INugetService, NugetService);
            ioc.serviceManager.addSingleton<ITerminalActivator>(ITerminalActivator, TerminalActivator);
            ioc.serviceManager.addSingleton<ITerminalActivationHandler>(
                ITerminalActivationHandler,
                PowershellTerminalActivationFailedHandler,
            );
            ioc.serviceManager.addSingleton<IExperimentService>(IExperimentService, ExperimentService);

            ioc.serviceManager.addSingleton<ITerminalActivationCommandProvider>(
                ITerminalActivationCommandProvider,
                Bash,
                TerminalActivationProviders.bashCShellFish,
            );
            ioc.serviceManager.addSingleton<ITerminalActivationCommandProvider>(
                ITerminalActivationCommandProvider,
                CommandPromptAndPowerShell,
                TerminalActivationProviders.commandPromptAndPowerShell,
            );
            ioc.serviceManager.addSingleton<ITerminalActivationCommandProvider>(
                ITerminalActivationCommandProvider,
                PyEnvActivationCommandProvider,
                TerminalActivationProviders.pyenv,
            );
            ioc.serviceManager.addSingleton<ITerminalActivationCommandProvider>(
                ITerminalActivationCommandProvider,
                CondaActivationCommandProvider,
                TerminalActivationProviders.conda,
            );
            ioc.serviceManager.addSingleton<ITerminalActivationCommandProvider>(
                ITerminalActivationCommandProvider,
                PipEnvActivationCommandProvider,
                TerminalActivationProviders.pipenv,
            );

            ioc.serviceManager.addSingleton<IAsyncDisposableRegistry>(
                IAsyncDisposableRegistry,
                AsyncDisposableRegistry,
            );
            ioc.serviceManager.addSingleton<IMultiStepInputFactory>(IMultiStepInputFactory, MultiStepInputFactory);
            ioc.serviceManager.addSingleton<IImportTracker>(IImportTracker, ImportTracker);
            ioc.serviceManager.addBinding(IImportTracker, IExtensionSingleActivationService);
            ioc.serviceManager.addSingleton<IShellDetector>(IShellDetector, TerminalNameShellDetector);
            ioc.serviceManager.addSingleton<IShellDetector>(IShellDetector, SettingsShellDetector);
            ioc.serviceManager.addSingleton<IShellDetector>(IShellDetector, UserEnvironmentShellDetector);
            ioc.serviceManager.addSingleton<IShellDetector>(IShellDetector, VSCEnvironmentShellDetector);
            ioc.serviceManager.addSingleton<IInsiderExtensionPrompt>(IInsiderExtensionPrompt, InsidersExtensionPrompt);
            ioc.serviceManager.addSingleton<IExtensionSingleActivationService>(
                IExtensionSingleActivationService,
                InsidersExtensionService,
            );
            ioc.serviceManager.addSingleton<IExtensionSingleActivationService>(
                IExtensionSingleActivationService,
                ReloadVSCodeCommandHandler,
            );
            ioc.serviceManager.addSingleton<IExtensionSingleActivationService>(
                IExtensionSingleActivationService,
                ReportIssueCommandHandler,
            );
            ioc.serviceManager.addSingleton<IExtensionChannelService>(
                IExtensionChannelService,
                ExtensionChannelService,
            );
            ioc.serviceManager.addSingleton<IExtensionChannelRule>(
                IExtensionChannelRule,
                ExtensionInsidersOffChannelRule,
                ExtensionChannel.off,
            );
            ioc.serviceManager.addSingleton<IExtensionChannelRule>(
                IExtensionChannelRule,
                ExtensionInsidersDailyChannelRule,
                ExtensionChannel.daily,
            );
            ioc.serviceManager.addSingleton<IExtensionChannelRule>(
                IExtensionChannelRule,
                ExtensionInsidersWeeklyChannelRule,
                ExtensionChannel.weekly,
            );
            ioc.serviceManager.addSingleton<IExtensionSingleActivationService>(
                IExtensionSingleActivationService,
                DebugSessionTelemetry,
            );
        }
        async function resetSettings(): Promise<void> {
            const configService = ioc.serviceManager.get<IConfigurationService>(IConfigurationService);
            await configService.updateSetting(
                'linting.pylintEnabled',
                true,
                rootWorkspaceUri,
                ConfigurationTarget.Workspace,
            );
        }
        async function getCurrentPythonPath(): Promise<string> {
            const { pythonPath } = getExtensionSettings(workspaceUri);
            if (path.basename(pythonPath) === pythonPath) {
                const pythonProc = await ioc.serviceContainer
                    .get<IPythonExecutionFactory>(IPythonExecutionFactory)
                    .create({ resource: workspaceUri });
                return pythonProc.getExecutablePath().catch(() => pythonPath);
            }
            return pythonPath;
        }
        test('Ensure pip is supported and conda is not', async () => {
            ioc.serviceManager.addSingletonInstance<IModuleInstaller>(
                IModuleInstaller,
                new MockModuleInstaller('mock', true),
            );
            const mockInterpreterLocator = TypeMoq.Mock.ofType<IInterpreterLocatorService>();
            mockInterpreterLocator
                .setup((p) => p.getInterpreters(TypeMoq.It.isAny()))
                .returns(() => Promise.resolve([]));
            ioc.serviceManager.rebindInstance<IInterpreterLocatorService>(
                IInterpreterLocatorService,
                mockInterpreterLocator.object,
                INTERPRETER_LOCATOR_SERVICE,
            );
            ioc.serviceManager.rebindInstance<IInterpreterLocatorService>(
                IInterpreterLocatorService,
                TypeMoq.Mock.ofType<IInterpreterLocatorService>().object,
                PIPENV_SERVICE,
            );
            ioc.serviceManager.addSingletonInstance<ITerminalHelper>(ITerminalHelper, instance(mock(TerminalHelper)));

            const processService = (await ioc.serviceContainer
                .get<IProcessServiceFactory>(IProcessServiceFactory)
                .create()) as MockProcessService;
            processService.onExec((file, args, _options, callback) => {
                if (args.length > 1 && args[0] === '-c' && args[1] === 'import pip') {
                    callback({ stdout: '' });
                }
                if (args.length > 0 && args[0] === '--version' && file === 'conda') {
                    callback({ stdout: '', stderr: 'not available' });
                }
            });
            const moduleInstallers = ioc.serviceContainer.getAll<IModuleInstaller>(IModuleInstaller);
            expect(moduleInstallers).length(4, 'Incorrect number of installers');

            const pipInstaller = moduleInstallers.find((item) => item.displayName === 'Pip')!;
            expect(pipInstaller).not.to.be.an('undefined', 'Pip installer not found');
            await expect(pipInstaller.isSupported()).to.eventually.equal(true, 'Pip is not supported');

            const condaInstaller = moduleInstallers.find((item) => item.displayName === 'Conda')!;
            expect(condaInstaller).not.to.be.an('undefined', 'Conda installer not found');
            await expect(condaInstaller.isSupported()).to.eventually.equal(false, 'Conda is supported');

            const mockInstaller = moduleInstallers.find((item) => item.displayName === 'mock')!;
            expect(mockInstaller).not.to.be.an('undefined', 'mock installer not found');
            await expect(mockInstaller.isSupported()).to.eventually.equal(true, 'mock is not supported');
        });

        test('Ensure pip is supported', async () => {
            ioc.serviceManager.addSingletonInstance<IModuleInstaller>(
                IModuleInstaller,
                new MockModuleInstaller('mock', true),
            );
            const pythonPath = await getCurrentPythonPath();
            const mockInterpreterLocator = TypeMoq.Mock.ofType<IInterpreterLocatorService>();
            mockInterpreterLocator
                .setup((p) => p.getInterpreters(TypeMoq.It.isAny()))
                .returns(() =>
                    Promise.resolve([
                        {
                            ...info,
                            architecture: Architecture.Unknown,
                            companyDisplayName: '',
                            displayName: '',
                            envName: '',
                            path: pythonPath,
                            envType: EnvironmentType.Conda,
                            version: new SemVer('1.0.0'),
                        },
                    ]),
                );
            ioc.serviceManager.rebindInstance<IInterpreterLocatorService>(
                IInterpreterLocatorService,
                mockInterpreterLocator.object,
                INTERPRETER_LOCATOR_SERVICE,
            );
            ioc.serviceManager.rebindInstance<IInterpreterLocatorService>(
                IInterpreterLocatorService,
                TypeMoq.Mock.ofType<IInterpreterLocatorService>().object,
                PIPENV_SERVICE,
            );
            ioc.serviceManager.addSingletonInstance<ITerminalHelper>(ITerminalHelper, instance(mock(TerminalHelper)));

            const processService = (await ioc.serviceContainer
                .get<IProcessServiceFactory>(IProcessServiceFactory)
                .create()) as MockProcessService;
            processService.onExec((file, args, _options, callback) => {
                if (args.length > 1 && args[0] === '-c' && args[1] === 'import pip') {
                    callback({ stdout: '' });
                }
                if (args.length > 0 && args[0] === '--version' && file === 'conda') {
                    callback({ stdout: '' });
                }
            });
            const moduleInstallers = ioc.serviceContainer.getAll<IModuleInstaller>(IModuleInstaller);
            expect(moduleInstallers).length(4, 'Incorrect number of installers');

            const pipInstaller = moduleInstallers.find((item) => item.displayName === 'Pip')!;
            expect(pipInstaller).not.to.be.an('undefined', 'Pip installer not found');
            await expect(pipInstaller.isSupported()).to.eventually.equal(true, 'Pip is not supported');
        });
        test('Ensure conda is supported', async () => {
            const serviceContainer = TypeMoq.Mock.ofType<IServiceContainer>();

            const configService = TypeMoq.Mock.ofType<IConfigurationService>();
            serviceContainer
                .setup((c) => c.get(TypeMoq.It.isValue(IConfigurationService)))
                .returns(() => configService.object);
            const settings = TypeMoq.Mock.ofType<IPythonSettings>();
            const pythonPath = 'pythonABC';
            settings.setup((s) => s.pythonPath).returns(() => pythonPath);
            configService.setup((c) => c.getSettings(TypeMoq.It.isAny())).returns(() => settings.object);
            serviceContainer.setup((c) => c.get(TypeMoq.It.isValue(ICondaService))).returns(() => condaService.object);
            serviceContainer
                .setup((c) => c.get(TypeMoq.It.isValue(ICondaLocatorService)))
                .returns(() => condaLocatorService.object);
            serviceContainer
                .setup((c) => c.get(TypeMoq.It.isValue(IComponentAdapter)))
                .returns(() => condaLocatorService.object);
            serviceContainer
                .setup((c) => c.get(TypeMoq.It.isValue(IExperimentService)))
                .returns(() => experimentService.object);
            condaService.setup((c) => c.isCondaAvailable()).returns(() => Promise.resolve(true));
            condaLocatorService
                .setup((c) => c.isCondaEnvironment(TypeMoq.It.isValue(pythonPath)))
                .returns(() => Promise.resolve(true));

            const condaInstaller = new CondaInstaller(serviceContainer.object);
            await expect(condaInstaller.isSupported()).to.eventually.equal(true, 'Conda is not supported');
        });
        test('Ensure conda is not supported even if conda is available', async () => {
            const serviceContainer = TypeMoq.Mock.ofType<IServiceContainer>();

            const configService = TypeMoq.Mock.ofType<IConfigurationService>();
            serviceContainer
                .setup((c) => c.get(TypeMoq.It.isValue(IConfigurationService)))
                .returns(() => configService.object);
            const settings = TypeMoq.Mock.ofType<IPythonSettings>();
            const pythonPath = 'pythonABC';
            settings.setup((s) => s.pythonPath).returns(() => pythonPath);
            configService.setup((c) => c.getSettings(TypeMoq.It.isAny())).returns(() => settings.object);
            serviceContainer.setup((c) => c.get(TypeMoq.It.isValue(ICondaService))).returns(() => condaService.object);
            serviceContainer
                .setup((c) => c.get(TypeMoq.It.isValue(IComponentAdapter)))
                .returns(() => condaLocatorService.object);
            serviceContainer
                .setup((c) => c.get(TypeMoq.It.isValue(ICondaLocatorService)))
                .returns(() => condaLocatorService.object);
            serviceContainer
                .setup((c) => c.get(TypeMoq.It.isValue(IExperimentService)))
                .returns(() => experimentService.object);
            condaService.setup((c) => c.isCondaAvailable()).returns(() => Promise.resolve(true));
            condaLocatorService
                .setup((c) => c.isCondaEnvironment(TypeMoq.It.isValue(pythonPath)))
                .returns(() => Promise.resolve(false));

            const condaInstaller = new CondaInstaller(serviceContainer.object);
            await expect(condaInstaller.isSupported()).to.eventually.equal(false, 'Conda should not be supported');
        });

        const resourceTestNameSuffix = resource ? ' with a resource' : ' without a resource';
        test(`Validate pip install arguments ${resourceTestNameSuffix}`, async () => {
            const interpreterPath = await getCurrentPythonPath();
            const mockInterpreterLocator = TypeMoq.Mock.ofType<IInterpreterLocatorService>();
            mockInterpreterLocator
                .setup((p) => p.getInterpreters(TypeMoq.It.isAny()))
                .returns(() => Promise.resolve([{ ...info, path: interpreterPath, envType: EnvironmentType.Unknown }]));
            ioc.serviceManager.rebindInstance<IInterpreterLocatorService>(
                IInterpreterLocatorService,
                mockInterpreterLocator.object,
                INTERPRETER_LOCATOR_SERVICE,
            );
            ioc.serviceManager.rebindInstance<IInterpreterLocatorService>(
                IInterpreterLocatorService,
                TypeMoq.Mock.ofType<IInterpreterLocatorService>().object,
                PIPENV_SERVICE,
            );

            const interpreter: PythonEnvironment = {
                ...info,
                envType: EnvironmentType.Unknown,
                path: PYTHON_PATH,
            };
            interpreterService
                .setup((x) => x.getActiveInterpreter(TypeMoq.It.isAny()))
                .returns(() => Promise.resolve(interpreter));

            const moduleName = 'xyz';

            const moduleInstallers = ioc.serviceContainer.getAll<IModuleInstaller>(IModuleInstaller);
            const pipInstaller = moduleInstallers.find((item) => item.displayName === 'Pip')!;

            expect(pipInstaller).not.to.be.an('undefined', 'Pip installer not found');

            let argsSent: string[] = [];
            mockTerminalService
                .setup((t) => t.sendCommand(TypeMoq.It.isAnyString(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
                .returns((_cmd: string, args: string[]) => {
                    argsSent = args;
                    return Promise.resolve();
                });
            interpreterService
                .setup((i) => i.getActiveInterpreter(TypeMoq.It.isAny()))

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .returns(() => Promise.resolve({ envType: EnvironmentType.Unknown } as any));

            await pipInstaller.installModule(moduleName, resource);

            mockTerminalFactory.verifyAll();
            expect(argsSent.join(' ')).equal(
                `-m pip install -U ${moduleName} --user`,
                'Invalid command sent to terminal for installation.',
            );
        });

        test(`Validate Conda install arguments ${resourceTestNameSuffix}`, async () => {
            const interpreterPath = await getCurrentPythonPath();
            const mockInterpreterLocator = TypeMoq.Mock.ofType<IInterpreterLocatorService>();
            mockInterpreterLocator
                .setup((p) => p.getInterpreters(TypeMoq.It.isAny()))
                .returns(() => Promise.resolve([{ ...info, path: interpreterPath, envType: EnvironmentType.Conda }]));
            ioc.serviceManager.rebindInstance<IInterpreterLocatorService>(
                IInterpreterLocatorService,
                mockInterpreterLocator.object,
                INTERPRETER_LOCATOR_SERVICE,
            );
            ioc.serviceManager.rebindInstance<IInterpreterLocatorService>(
                IInterpreterLocatorService,
                TypeMoq.Mock.ofType<IInterpreterLocatorService>().object,
                PIPENV_SERVICE,
            );

            const moduleName = 'xyz';

            const moduleInstallers = ioc.serviceContainer.getAll<IModuleInstaller>(IModuleInstaller);
            const pipInstaller = moduleInstallers.find((item) => item.displayName === 'Pip')!;

            expect(pipInstaller).not.to.be.an('undefined', 'Pip installer not found');

            let argsSent: string[] = [];
            mockTerminalService
                .setup((t) => t.sendCommand(TypeMoq.It.isAnyString(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
                .returns((_cmd: string, args: string[]) => {
                    argsSent = args;
                    return Promise.resolve();
                });

            await pipInstaller.installModule(moduleName, resource);

            mockTerminalFactory.verifyAll();
            expect(argsSent.join(' ')).equal(
                `-m pip install -U ${moduleName}`,
                'Invalid command sent to terminal for installation.',
            );
        });

        test(`Validate pipenv install arguments ${resourceTestNameSuffix}`, async () => {
            const mockInterpreterLocator = TypeMoq.Mock.ofType<IInterpreterLocatorService>();
            mockInterpreterLocator
                .setup((p) => p.getInterpreters(TypeMoq.It.isAny()))
                .returns(() =>
                    Promise.resolve([{ ...info, path: 'interpreterPath', envType: EnvironmentType.VirtualEnv }]),
                );
            ioc.serviceManager.rebindInstance<IInterpreterLocatorService>(
                IInterpreterLocatorService,
                mockInterpreterLocator.object,
                PIPENV_SERVICE,
            );

            const moduleName = 'xyz';
            const moduleInstallers = ioc.serviceContainer.getAll<IModuleInstaller>(IModuleInstaller);
            const pipInstaller = moduleInstallers.find((item) => item.displayName === 'pipenv')!;

            expect(pipInstaller).not.to.be.an('undefined', 'pipenv installer not found');

            let argsSent: string[] = [];
            let command: string | undefined;
            mockTerminalService
                .setup((t) => t.sendCommand(TypeMoq.It.isAnyString(), TypeMoq.It.isAny(), TypeMoq.It.isAny()))
                .returns((cmd: string, args: string[]) => {
                    argsSent = args;
                    command = cmd;
                    return Promise.resolve();
                });

            await pipInstaller.installModule(moduleName, resource);

            mockTerminalFactory.verifyAll();
            expect(command!).equal('pipenv', 'Invalid command sent to terminal for installation.');
            expect(argsSent.join(' ')).equal(
                `install ${moduleName} --dev`,
                'Invalid command arguments sent to terminal for installation.',
            );
        });
    });
});
