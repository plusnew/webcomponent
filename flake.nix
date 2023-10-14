{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem
      (system:
        let pkgs = nixpkgs.legacyPackages.${system};
            name = "webcomponent";

        in {
          devShell = pkgs.mkShell {
            buildInputs = [
              pkgs.nodejs
              pkgs.typescript
              pkgs.nodePackages.typescript-language-server
            ];
          };
        }
      );
}

