{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    npmlock2nixSrc = {
      url = "github:nix-community/npmlock2nix";
      flake = false;
    };
  };

  outputs = { self, nixpkgs, flake-utils, npmlock2nixSrc }:
    flake-utils.lib.eachDefaultSystem
      (system:
        let pkgs = nixpkgs.legacyPackages.${system};
            npmlock2nix = import npmlock2nixSrc { inherit pkgs; };

        in {
          devShells.default = pkgs.mkShell (with pkgs; {
            packages = [
              importNpmLock.hooks.linkNodeModulesHook
              nodejs
            ];

            npmDeps = importNpmLock.buildNodeModules {
              npmRoot = ./.;
              inherit nodejs;
            };
          });

          checks.default = pkgs.importNpmLock.buildNodeModules (with pkgs;  {
            npmRoot = ./.;
            inherit nodejs;
            derivationArgs = {
              buildCommands = [
                "npm exec tsc -- --noEmit"
                "CHROME_PATH=${pkgs.chromium}/bin/chromium XDG_CONFIG_HOME=$TMPDIR/chromium-config XDG_CACHE_HOME=$TMPDIR=/chromium-cache npm run test"
              ];
              installPhase = ''
                touch $out
              '';
            };
          });
        }
      );
}

