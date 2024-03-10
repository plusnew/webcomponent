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
          devShells.default = npmlock2nix.v2.shell {
            nodejs = pkgs.nodejs;
            src = ./.;
          };

          checks.default = npmlock2nix.v2.build {
            nodejs = pkgs.nodejs;
            src = ./.;
            buildCommands = [
              "npm exec tsc -- --noEmit"
              "CHROME_PATH=${pkgs.chromium}/bin/chromium XDG_CONFIG_HOME=$TMPDIR/chromium-config XDG_CACHE_HOME=$TMPDIR=/chromium-cache npm run test"
            ];
            installPhase = ''
              touch $out
            '';
          };
        }
      );
}

